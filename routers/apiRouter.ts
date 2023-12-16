import { Request, Response, Router } from 'express'
import * as chatsController from '../controllers/chatsController'
import { protectRoute } from '../middleware/authMiddleware'

import { User as TUser } from '../models/user'

const router = Router()

router.get('/me', ...protectRoute(), (req: Request, res: Response) => {
  const user = req.user as TUser

  //   @ts-ignore
  const { refreshTokens, passwordEncrypted, ...userWithoutTokens } = user.toObject()
  res.json(userWithoutTokens)
})

router.get('/chats', chatsController.index)

export default router
