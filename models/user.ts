import mongoose from 'mongoose'
import crypto from 'crypto'

import UserAI from './userAI.js'
import Chat from './chat.js'

export type User = {
  email: string
  firstName: string
  lastName: string
  passwordEncrypted: string
  refreshTokens: string[]
  chatToken: string
  avatarUrl: string
  avatarPublicId: string
  _id: mongoose.Types.ObjectId
}

const userSchema = new mongoose.Schema<User>({
  email: { type: String, required: true, unique: true, maxlength: 100 },
  firstName: { type: String, required: true, maxlength: 100 },
  lastName: { type: String, required: true, maxlength: 100 },
  passwordEncrypted: { type: String, required: true },
  refreshTokens: { type: [String], default: [] },
  chatToken: { type: String, unique: true }, // Used to create chat with user
  avatarUrl: { type: String },
})

userSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.chatToken = await generateChatToken()
  }

  next()
})

// Create UserAI on User creation
userSchema.post('save', async function (doc, next) {
  await UserAI.create({ user: doc._id })
  await Chat.create({ users: [doc._id], isAI: true })

  next()
})

userSchema.virtual('avatarPublicId').get(function () {
  return this.avatarUrl.split('/').pop()?.split('.')[0]
})

const User = mongoose.model('User', userSchema)

async function generateChatToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const user = await User.findOne({ chatToken: token })

  if (user) {
    return await generateChatToken()
  }

  return token
}

export default User
