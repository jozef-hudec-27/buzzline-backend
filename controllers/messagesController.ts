import asyncHandler from 'express-async-handler'
import { body, validationResult } from 'express-validator'

import Message from '../models/message'
import Chat from '../models/chat'
import { User as TUser } from '../models/user'
import { protectRoute } from '../middleware/authMiddleware'

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
      .populate('sender', 'firstName lastName')
      .populate('readBy', 'firstName lastName')

    res.json(messages)
  }),
]
