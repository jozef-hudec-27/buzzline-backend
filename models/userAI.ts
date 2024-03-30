import mongoose from 'mongoose'

export type UserAI = {
  _id: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
}

const userAISchema = new mongoose.Schema<UserAI>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
})

const UserAI = mongoose.model('UserAI', userAISchema)

export default UserAI
