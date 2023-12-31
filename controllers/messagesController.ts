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

    let { page = 1, limit = 20 } = req.query

    const paginateOptions = {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: [
        { path: 'sender', select: 'firstName lastName avatarUrl' },
        { path: 'readBy', select: 'firstName lastName' },
      ],
    }

    // @ts-ignore
    const result = await Message.paginate({ chat: chatId }, paginateOptions)

    res.json(result)
  }),
]
