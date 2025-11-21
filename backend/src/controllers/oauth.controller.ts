import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from '../config/passport';

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Google OAuth 로그인
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google
 */
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth 콜백
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to frontend with token
 */
export const googleAuthCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { session: false }, (err: any, user: any) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  })(req, res, next);
};

/**
 * @swagger
 * /api/auth/kakao:
 *   get:
 *     summary: Kakao OAuth 로그인
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Kakao
 */
export const kakaoAuth = passport.authenticate('kakao');

/**
 * @swagger
 * /api/auth/kakao/callback:
 *   get:
 *     summary: Kakao OAuth 콜백
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to frontend with token
 */
export const kakaoAuthCallback = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('kakao', { session: false }, (err: any, user: any) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=authentication_failed`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  })(req, res, next);
};
