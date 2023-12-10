import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, maxlength: 100 },
  firstName: { type: String, required: true, maxlength: 100 },
  lastName: { type: String, required: true, maxlength: 100 },
  passwordEncrypted: { type: String, required: true },
  tokens: { type: [String], default: [] },
})

export default mongoose.model('User', userSchema)
