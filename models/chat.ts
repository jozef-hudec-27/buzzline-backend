import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
  users: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', required: true, maxlength: 50 },
  isGroup: { type: Boolean, default: false },
})

export default mongoose.model('Chat', chatSchema)
