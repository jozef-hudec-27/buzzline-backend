import mongoose from 'mongoose'
mongoose.set('strictQuery', false)

async function dbConnect() {
  if (process.env.DB_CONNECTION_STRING && process.env.NODE_ENV !== 'test') {
    await mongoose.connect(process.env.DB_CONNECTION_STRING)
  }
}

export default dbConnect
