import express, { Express, Request, Response, NextFunction, Errback } from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import createError from 'http-errors'
import logger from 'morgan'
import dotenv from 'dotenv'

import dbConnect from './mongo-config'

dotenv.config()
dbConnect()

// routers
import apiRouter from './routers/apiRouter'

const app: Express = express()

// middleware
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', apiRouter)

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
