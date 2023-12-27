import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const cloudinaryInstance = cloudinary

export default new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'buzzline',
      allowed_formats: ['jpg', 'png', 'jpeg', 'svg'],
      public_id: Date.now().toString(),
      transformation: [
        { gravity: 'face', height: 200, width: 200, crop: 'thumb' },
        { radius: 'max' },
        { fetch_format: 'auto' },
      ],
    }
  },
})
