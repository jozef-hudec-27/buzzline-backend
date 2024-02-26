import express, { Express, Request, Response, NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import createError from 'http-errors'
import logger from 'morgan'
import dotenv from 'dotenv'
import cors from 'cors'
import passport from 'passport'
import compression from 'compression'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'

import dbConnect from './mongo-config.js'
import passportConfig from './passport-config.js'

dotenv.config()
dbConnect()
passportConfig(passport)

// routers
import apiRouter from './routers/apiRouter.js'
import authRouter from './routers/authRouter.js'

const app: Express = express()

// middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200,
  })
)
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(passport.initialize())
app.use(compression())

app.use('/api', apiRouter)
app.use('/auth', authRouter)

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404))
})

// error handler
app.use((err: any, req: Request, res: Response) => {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  res.status(err.status || 500).json({ message: err.message || 'There was an error.' })
})

export default app
