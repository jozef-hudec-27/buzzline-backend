import jwt from 'jsonwebtoken'
import passport from 'passport'

import { ACCESS_TOKEN_EXPIRATION } from '../config.js'

import { JwtPayload } from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'

function isJwtPayload(object: any): object is JwtPayload {
  return !!('exp' in object && 'iat' in object)
}

function checkTokenValidity(
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
    } else if (
      err ||
      // Refresh token must not be used for authentication
      (isJwtPayload(decoded) && Math.abs((decoded.exp ?? 0) - (decoded.iat ?? 0) - ACCESS_TOKEN_EXPIRATION) > 5)
    ) {
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

type AllowedProtectMiddleware = typeof checkTokenValidity | typeof passportAuthenticate

export const protectRoute = () => {
  const middleware: AllowedProtectMiddleware[] = [checkTokenValidity, passportAuthenticate]

  return middleware
}
