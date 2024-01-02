import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import passport from 'passport'

function checkTokenExpiration(
  req: Request,
  res: Response,
  next: NextFunction
): Response<any, Record<string, any>> | undefined {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token || token === 'null') {
    return res.status(401).json({ message: 'Token missing' })
  }

  jwt.verify(token, process.env.JWT_SECRET || '', (err, decoded) => {
    if (err && err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    } else if (err) {
      return res.status(401).json({ message: 'Token invalid' })
    }

    next()
  })
}

function passportAuthenticate(req: Request, res: Response, next: NextFunction): void {
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
}

type AllowedProtectMiddleware = typeof checkTokenExpiration | typeof passportAuthenticate

export const protectRoute = () => {
  const middleware: AllowedProtectMiddleware[] = [checkTokenExpiration, passportAuthenticate]

  return middleware
}
