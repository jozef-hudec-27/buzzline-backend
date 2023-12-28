import asyncHandler from 'express-async-handler'

import Message from '../models/message.js'
import Chat from '../models/chat.js'
import { User as TUser } from '../models/user.js'
import { protectRoute } from '../middleware/authMiddleware.js'

import { Request, Response } from 'express'

export const index = [
  ...protectRoute(),

  asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params
    const user = req.user as TUser

    const chat = await Chat.findOne({ _id: chatId, users: user._id })

    if (!chat) {
      res.status(404).json({ message: 'Chat not found.' })
      return
    }

    const messages = await Message.find({ chat: chat._id })
      .sort({ createdAt: 1 })
      .populate('sender', 'firstName lastName avatarUrl')
      .populate('readBy', 'firstName lastName')

    res.json(messages)
  }),
]
