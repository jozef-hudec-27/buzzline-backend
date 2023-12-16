import User from '../models/user'
import { body, validationResult } from 'express-validator'
import asyncHandler from 'express-async-handler'
import bcrypt from 'bcryptjs'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { Request, Response, NextFunction, CookieOptions } from 'express'
import { protectRoute } from '../middleware/authMiddleware'

const REFRESH_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  maxAge: 604800000,
  secure: true,
  sameSite: 'none',
}

export const register = [
  body('email')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Email must be between 1 and 100 characters.')
    .isEmail()
    .withMessage('Email must be a valid email address.')
    .custom(async (value) => {
      const user = await User.findOne({ email: value })

      if (user) throw new Error('User with that email already exists.')
    })
    .escape(),
  body('firstName', 'First name must be between 1 and 100 characters.').trim().isLength({ min: 1, max: 100 }).escape(),
  body('lastName', 'Last name must be between 1 and 100 characters.').trim().isLength({ min: 1, max: 100 }).escape(),
  body('password', 'Password must be between 6 and 64 characters!').trim().isLength({ min: 6, max: 64 }),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match.')

    return true
  }),

  async (req: Request, res: Response, next: NextFunction) => {
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      if (err) return next(err)

      const errors = validationResult(req)

      try {
        const user = new User({
          email: req.body.email,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          passwordEncrypted: hashedPassword,
        })

        if (!errors.isEmpty()) {
          return res.status(422).json({ errors: errors.array() })
        }

        await user.save()
        res.status(201).json(user)
      } catch (err) {
        next(err)
      }
    })
  },
]

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    res.status(400).json({ message: 'Invalid email or password.' })
    return
  }

  const { passwordEncrypted, email, _id } = user

  const passwordMatch = await bcrypt.compare(req.body.password, passwordEncrypted)

  if (!passwordMatch) {
    res.status(400).json({ message: 'Invalid email or password.' })
    return
  }

  // Access token expires in 20 minutes
  const accessToken = jwt.sign({ user: { email, _id } }, process.env.JWT_SECRET || '' || '', {
    expiresIn: 1200,
  })
  const refreshToken = jwt.sign({ user: { _id } }, process.env.JWT_SECRET || '', { expiresIn: '7d' })

  await User.findByIdAndUpdate(_id, { $push: { refreshTokens: refreshToken } })

  res.cookie('refreshToken', refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS)

  res.json({ accessToken })
})

export const refresh = [
  // Check if valid refresh token is in DB
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies?.refreshToken

    if (!refreshToken) {
      res.status(401).json({ message: 'Missing token.' })
      return
    }

    const isInDB = await User.findOne({ refreshTokens: refreshToken })

    if (!isInDB) {
      res.status(401).json({ message: 'Invalid token.' })
      return
    }

    next()
  }),

  // Check token expiration
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || '', { ignoreExpiration: true }) as JwtPayload

    // Refresh token has expired
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      await User.findOneAndUpdate({ refreshTokens: refreshToken }, { refreshTokens: [] })

      res.clearCookie('refreshToken', REFRESH_TOKEN_COOKIE_OPTIONS)

      res.status(403).json({ message: 'Expired token.' })
    }

    // Refresh token has not expired yet
    next()
  }),

  // Issue new access token
  asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || '') as JwtPayload

      const user = await User.findById(decoded.user._id)

      if (!user) {
        res.status(404).json({ message: 'User not found.' })
        return
      }

      const { email, _id } = user
      const accessToken = jwt.sign({ user: { email, _id } }, process.env.JWT_SECRET || '', {
        expiresIn: 1200,
      })

      res.json({ accessToken })
    } catch (err) {
      res.status(403).json({ message: 'Invalid token.' })
    }
  }),
]

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken

  if (!refreshToken) {
    res.status(204).end()
    return
  }

  const user = await User.findOneAndUpdate({ refreshTokens: refreshToken }, { refreshTokens: [] }, { new: true })

  res.clearCookie('refreshToken', REFRESH_TOKEN_COOKIE_OPTIONS)

  if (!user) {
    res.status(204).end()
    return
  }

  res.status(204).end()
})
