import asyncHandler from 'express-async-handler'
import { body, validationResult } from 'express-validator'

import Chat from '../models/chat.js'
import Message from '../models/message.js'
import User, { User as TUser } from '../models/user.js'
import { protectRoute } from '../middleware/authMiddleware.js'

import { Request, Response } from 'express'

export const index = [
  ...protectRoute(),

  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as TUser
    const chats = await Chat.find({ users: user._id })
      .populate('users', 'firstName lastName avatarUrl')
      .populate('newestMessage', 'content createdAt readBy sender')
      .lean()

    //   Sort by newest message, if newestMessage is null, put it at the end
    chats.sort((a: any, b: any) => {
      if (!a.newestMessage) return 1
      if (!b.newestMessage) return -1
      return b.newestMessage.createdAt - a.newestMessage.createdAt
    })

    chats.forEach((chat) => {
      chat.users = chat.users.filter((u) => u._id.toString() !== user._id.toString())
    })

    res.json(chats)
  }),
]

export const show = [
  ...protectRoute(),

  asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params
    const user = req.user as TUser

    const chat = await Chat.findOne({ _id: chatId, users: user._id })
      .populate('users', 'firstName lastName email avatarUrl')
      .populate('newestMessage', 'content createdAt readBy sender')
      .lean()

    if (!chat) {
      res.status(404).json({ message: 'Chat not found.' })
      return
    }

    chat.users = chat.users.filter((u) => u._id.toString() !== user._id.toString())

    res.json(chat)
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
    const me = req.user as TUser

    if (!user || user._id === me._id) {
      res.status(404).json({ message: 'User not found.' })
      return
    }

    let chat = await Chat.findOne({ users: { $all: [user._id, me._id] } })

    if (chat) {
      res.status(409).json({ message: 'Chat already exists.' })
      return
    }

    chat = new Chat({
      users: [user._id, me._id],
    })

    await chat.save()
    chat = await chat.populate('users', 'firstName lastName avatarUrl')
    res.status(201).json(chat)
  }),
]

export const readUnreadMessages = [
  ...protectRoute(),

  asyncHandler(async (req: Request, res: Response) => {
    const { chatId } = req.params

    if (!chatId) {
      res.status(422).json({ message: 'Chat not found.' })
      return
    }

    const user = req.user as TUser

    const chat = await Chat.findOne({ _id: chatId, users: user._id })

    if (!chat) {
      res.status(404).json({ message: 'Chat not found.' })
      return
    }

    const unreadMessages = await Message.find({ chat: chat._id, readBy: { $ne: user._id }, sender: { $ne: user._id } })
    unreadMessages.forEach(async (message) => {
      await Message.updateOne({ _id: message._id }, { $addToSet: { readBy: user._id } })
    })

    res.status(204).end()
  }),
]
