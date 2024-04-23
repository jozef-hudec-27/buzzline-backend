import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

import { MAX_MSG_LENGTH } from '../config.js'

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: function (): string {
        // @ts-ignore
      return this.isAI ? 'UserAI' : 'User'
    },
    required: true,
  },
  content: { type: String, maxlength: MAX_MSG_LENGTH, default: '' },
  voiceClipUrl: { type: String },
  imageUrl: { type: String },
  isRemoved: { type: Boolean },
  isAI: { type: Boolean, default: false },
  readBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  createdAt: { type: Date, default: Date.now },
})

messageSchema.methods.publicIdOf = function (asset: 'voiceClip' | 'image') {
  const url = asset === 'voiceClip' ? this.voiceClipUrl : this.imageUrl

  if (!url) return

  return url.split('/').pop()?.split('.')[0]
}

messageSchema.plugin(mongoosePaginate)

export default mongoose.model('Message', messageSchema)
