import { Router } from 'express'

import * as chatsController from '../controllers/chatsController.js'
import * as messagesController from '../controllers/messagesController.js'
import * as meController from '../controllers/meController.js'

const router = Router()

router.get('/me', meController.details)
router.post('/me/avatar', meController.updateAvatar)
router.post('/me/clear-ai-conversation', meController.clearAIConversation)

router.get('/chats', chatsController.index)
router.get('/chats/:chatId', chatsController.show)
router.post('/chats/:chatId/messages/read', chatsController.readUnreadMessages)
router.post('/chats', chatsController.create)

router.get('/chats/:chatId/messages', messagesController.index)

export default router
