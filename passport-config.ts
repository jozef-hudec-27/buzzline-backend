import dotenv from 'dotenv'

import User from './models/user'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'

import { Request } from 'express'
import { PassportStatic } from 'passport'
import { JwtPayload } from 'jsonwebtoken'

dotenv.config()

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  passReqToCallback: true,
}

export default (passport: PassportStatic) => {
  passport.use(
    new JwtStrategy(options, async (req: Request, payload: JwtPayload, done: any) => {
      try {
        const user = await User.findById(payload.user?._id)

        if (user) {
          return done(null, user)
        }

        return done(null, false)
      } catch (err) {
        return done(err, false)
      }
    })
  )
}
