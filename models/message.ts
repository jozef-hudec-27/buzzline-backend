import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, maxlength: 500, default: '' },
  voiceClipUrl: { type: String },
  imageUrl: { type: String },
  readBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  createdAt: { type: Date, default: Date.now },
})

messageSchema.plugin(mongoosePaginate)

export default mongoose.model('Message', messageSchema)
