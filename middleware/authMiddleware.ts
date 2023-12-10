import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import passport from 'passport'

const checkTokenExpiration = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized.' })
  }

  jwt.verify(token, process.env.JWT_SECRET || '', (err, decoded) => {
    if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    } else if (err) {
      return res.status(401).json({ message: 'Invalid token' })
    }

    next()
  })
}

export const protectRoute = () => {
  const middleware: any[] = [checkTokenExpiration]

  middleware.push((req: Request, res: Response, next: NextFunction) => {
    // Override passport's default behavior with custom callback
    passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
      if (err) {
        return next(err)
      }

      if (!user) {
        if (info === 'Forbidden') {
          return res.status(403).json({ message: 'Forbidden' })
        }

        return res.status(401).json({ message: 'Unauthorized' })
      }

      req.user = user
      next()
    })(req, res, next)
  })

  return middleware
}
