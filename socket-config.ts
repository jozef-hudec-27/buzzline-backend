import { Server as S, IncomingMessage, ServerResponse } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { fileTypeFromBuffer } from 'file-type'
import { Readable } from 'stream'

import Message from './models/message.js'
import User from './models/user.js'
import Chat from './models/chat.js'
import { cloudinaryInstance } from './cloudinary-config.js'

interface CustomSocket extends Socket {
  userId: string
}

async function sendOnlineStatus(me: string, io: Server, isOnline: boolean) {
  const friends = new Set()
  const chats = await Chat.find({ users: me })

  chats.forEach((chat) => {
    chat.users.forEach((friend) => {
      const friendId = friend._id.toString()

      if (friendId === me) return

      //   Prevent sending online status multiple times to the same user if they are in multiple chats
      if (!friends.has(friendId)) {
        friends.add(friendId)
        io.to(friendId).emit('onlineStatus', { userId: me, isOnline })
      }
    })
  })
}

function handleJoinRoom(socket: CustomSocket, data: any) {
  socket.rooms.forEach((room) => {
    if (room === socket.userId) return

    socket.leave(room)
  })

  socket.join(data)
}

async function uploadToCloud(buffer: Buffer) {
  const stream = Readable.from(buffer)

  return new Promise<string | undefined>((resolve, reject) => {
    const cldUploadStream = cloudinaryInstance.uploader.upload_stream(
      { folder: 'buzzline', resource_type: 'auto', secure: true },
      (err, res) => {
        if (err) {
          reject(err)
        } else {
          resolve(res?.secure_url)
        }
      }
    )
    stream.pipe(cldUploadStream)
  })
}

async function handleMessage(socket: CustomSocket, io: Server, data: any) {
  const user = await User.findById(socket.userId)
  if (!user) {
    return
  }

  let voiceClipUrl = null
  let imageUrl = null

  if (data.voiceClip) {
    const voiceClipBuffer = data.voiceClip as Buffer

    if (voiceClipBuffer.length > 5 * 1024 * 1024) {
      return socket.emit('error', 'Voice clip is too large')
    }

    const type = await fileTypeFromBuffer(voiceClipBuffer)
    // if (!type || type.ext !== 'webm') {
    if (!type) {
      return socket.emit('error', 'Invalid voice clip')
    }

    // Upload audio file to Cloudinary
    try {
      voiceClipUrl = await uploadToCloud(voiceClipBuffer)
    } catch (e) {
      return socket.emit('error', 'Error uploading voice clip')
    }
  } else if (data.image) {
    const imageBuffer = data.image as Buffer

    if (imageBuffer.length > 5 * 1024 * 1024) {
      return socket.emit('error', 'Image is too large')
    }

    const type = await fileTypeFromBuffer(imageBuffer)
    if (!type || !type.mime.startsWith('image')) {
      return socket.emit('error', 'Invalid image')
    }

    // Upload image to Cloudinary
    try {
      imageUrl = await uploadToCloud(imageBuffer)
    } catch (e) {
      return socket.emit('error', 'Error uploading image')
    }
  } else if (data.content?.length > 500) {
    return socket.emit('error', 'Message is too long')
  }

  let message = new Message({
    chat: data.chat,
    sender: user._id,
    content: data.content || '',
    voiceClipUrl: voiceClipUrl,
    imageUrl: imageUrl,
    // @ts-ignore
    readBy: (await io.in(data.chat).fetchSockets()).map((sc) => sc.userId),
  })

  await Chat.findByIdAndUpdate(data.chat, { newestMessage: message._id })

  message = await message.save()
  message = await message.populate('sender', 'firstName lastName avatarUrl')

  socket.to(data.chat).emit('message', message)
}

async function handleTyping(socket: CustomSocket, data: any) {
  const user = await User.findById(socket.userId)
  if (!user) {
    return
  }

  const isTyping = data.isTyping

  socket.to(data.chat).emit('typing', { userId: user._id, isTyping })
}

async function handleMessageRemove(socket: CustomSocket, data: any) {
  const { chat, messageId } = data

  const message = await Message.findOne({ _id: messageId, chat: chat })
  if (!message || message.sender.toString() !== socket.userId) {
    return socket.emit('error', 'Message not found')
  }

  // Delete media from the cloud
  if (message.voiceClipUrl || message.imageUrl) {
    // @ts-ignore
    cloudinaryInstance.uploader.destroy(`buzzline/${message.publicIdOf(message.voiceClipUrl ? 'voiceClip' : 'image')}`)
  }

  await Message.findByIdAndUpdate(message._id, { isRemoved: true, content: '', voiceClipUrl: null, imageUrl: null })

  socket.to(chat).emit('messageRemove', { messageId })
}

export default function (server: S<typeof IncomingMessage, typeof ServerResponse>) {
  const io = new Server(server, { cors: { origin: process.env.CLIENT_URL }, maxHttpBufferSize: 5e6 }) // 5mb max buffer size

  //   attach user to socket
  io.use((socket, next) => {
    const token = socket.handshake.query?.token as string

    if (!token) {
      return next(new Error('Authentication error'))
    }

    jwt.verify(token, process.env.JWT_SECRET || '', (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'))
      }

      //   @ts-ignore
      socket.userId = decoded?.user?._id
      next()
    })
  }).on('connection', (socket: Socket) => {
    const customSocket = socket as CustomSocket

    customSocket.join(customSocket.userId)
    sendOnlineStatus(customSocket.userId, io, true)

    customSocket.on('disconnect', () => sendOnlineStatus(customSocket.userId, io, false))

    customSocket.on('joinRoom', (data) => handleJoinRoom(customSocket, data))

    customSocket.on('message', async (data) => await handleMessage(customSocket, io, data))

    customSocket.on('typing', async (data) => await handleTyping(customSocket, data))

    customSocket.on('messageRemove', async (data) => await handleMessageRemove(customSocket, data))

    customSocket.on('dm', (data) => {
      io.to(data.to).emit('dm', data)
    })

    customSocket.on('onlineStatusResponse', (data) => {
      io.to(data.to).emit('onlineStatus', { userId: customSocket.userId, isOnline: true, isResponse: true })
    })
  })
}
