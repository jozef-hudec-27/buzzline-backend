import { Server as S, IncomingMessage, ServerResponse } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'

import Message from './models/message'
import User from './models/user'

interface CustomSocket extends Socket {
  userInfo: {
    user: {
      _id: string
    }
  }
}

function handleJoinRoom(socket: CustomSocket, data: any) {
  socket.rooms.forEach((room) => {
    socket.leave(room)
  })

  socket.join(data)
}

async function handleMessage(socket: CustomSocket, data: any) {
  const user = await User.findById(socket.userInfo.user._id)
  if (!user) {
    return
  }

  const message = new Message({
    chat: data.chat,
    sender: user._id,
    content: data.content,
  })

  await message.save()

  socket.to(data.chat).emit('message', message)
}

export default function (server: S<typeof IncomingMessage, typeof ServerResponse>) {
  const io = new Server(server, { cors: { origin: 'http://localhost:3000' } })

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
      socket.userInfo = decoded
      next()
    })
  }).on('connection', (socket: Socket) => {
    const customSocket = socket as CustomSocket

    socket.on('joinRoom', (data) => handleJoinRoom(customSocket, data))

    socket.on('message', async (data) => await handleMessage(customSocket, data))
  })
}
