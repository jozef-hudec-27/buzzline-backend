import asyncHandler from 'express-async-handler'
import { body, validationResult } from 'express-validator'

import Chat from '../models/chat'
import User from '../models/user'
import { protectRoute } from '../middleware/authMiddleware'

import { Request, Response } from 'express'

export const index = [
  ...protectRoute(),

  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as User
    const chats = await Chat.find({ users: user?._id }).populate('users')
    res.json(chats)
  }),
]

export const create = [
  ...protectRoute(),

  body('chatToken', 'Invalid chat token.').trim().isLength({ min: 64, max: 64 }).escape(),

  asyncHandler(async (req: Request, res: Response) => {
    const chatToken = req.body.chatToken

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() })
      return
    }

    const user = await User.findOne({ chatToken })

    if (!user) {
      res.status(404).json({ message: 'User not found.' })
      return
    }

    const me = req.user as User

    let chat = await Chat.findOne({ users: [user._id, me._id] })

    if (chat) {
      res.status(409).json({ message: 'Chat already exists.' })
      return
    }

    chat = new Chat({
      users: [user._id, me._id],
    })

    await chat.save()
    res.status(201).json(chat)
  }),
]
