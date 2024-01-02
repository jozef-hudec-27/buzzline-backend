import { protectRoute } from '../middleware/authMiddleware.js'
import upload from '../multer.js'
import { cloudinaryInstance } from '../cloudinary-config.js'

import User, { User as TUser } from '../models/user.js'

import { Request, Response } from 'express'

export const updateAvatar = [
  ...protectRoute(),

  upload.single('avatar'),

  async (req: Request, res: Response) => {
    const filePath = req.file?.path

    if (!filePath) {
      res.status(400).end()
    }

    const user = req.user as TUser

    // Delete old avatar from the cloud
    if (user.avatarUrl) {
      cloudinaryInstance.uploader.destroy(`buzzline/${user.avatarPublicId}`)
    }

    await User.findByIdAndUpdate(user._id, { avatarUrl: filePath })

    res.json({ avatar: filePath })
  },
]
