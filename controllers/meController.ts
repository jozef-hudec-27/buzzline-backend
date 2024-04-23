import asyncHandler from 'express-async-handler'

import { protectRoute } from '../middleware/authMiddleware.js'
import upload from '../multer.js'
import { cloudinaryInstance } from '../cloudinary-config.js'

import User, { User as TUser } from '../models/user.js'
import Chat from '../models/chat.js'
import Message from '../models/message.js'

import { Request, Response } from 'express'

export const details = [
  ...protectRoute(),

  (req: Request, res: Response) => {
    const user = req.user as TUser

    //   @ts-ignore
    const { refreshTokens, passwordEncrypted, ...userWithoutTokens } = user.toObject()
    res.json(userWithoutTokens)
  },
]

export const updateAvatar = [
  ...protectRoute(),

  upload.single('avatar'),

  async (req: Request, res: Response) => {
    const filePath = req.file?.path

    if (!filePath) {
      res.status(400).end()
    }

    const user = req.user as TUser

    // Delete old avatar from the cloud
    if (user.avatarUrl) {
      cloudinaryInstance.uploader.destroy(`buzzline/${user.avatarPublicId}`)
    }

    await User.findByIdAndUpdate(user._id, { avatarUrl: filePath })

    res.json({ avatar: filePath })
  },
]

export const clearAIConversation = [
  ...protectRoute(),

  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as TUser

    const chat = await Chat.findOne({ isAI: true, users: user._id })
    await Chat.updateOne({ _id: chat?.id }, { newestMessage: null })

    const deletedMessages = await Message.deleteMany({ chat: chat?._id })

    res.json({ ...deletedMessages, chatId: chat?._id })
  }),
]
