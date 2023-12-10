import mongoose from 'mongoose'
import crypto from 'crypto'

type User = {
  email: string
  firstName: string
  lastName: string
  passwordEncrypted: string
  refreshTokens: string[]
  chatToken: string
  _id: mongoose.Types.ObjectId
}

const userSchema = new mongoose.Schema<User>({
  email: { type: String, required: true, unique: true, maxlength: 100 },
  firstName: { type: String, required: true, maxlength: 100 },
  lastName: { type: String, required: true, maxlength: 100 },
  passwordEncrypted: { type: String, required: true },
  refreshTokens: { type: [String], default: [] },
  chatToken: { type: String, unique: true }, // Used to create chat with user
})

userSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.chatToken = await generateChatToken()
  }

  next()
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
