import { Router } from 'express'
import * as chatsController from '../controllers/chatsController'

const router = Router()

router.get('/chats', chatsController.index)

export default router
