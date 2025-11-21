import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as KakaoStrategy } from 'passport-kakao';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { prisma } from './database';

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET!,
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (user) {
        return done(null, user);
      }

      return done(null, false);
    } catch (error) {
      return done(error, false);
    }
  })
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Find or create user
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { providerId: profile.id, provider: 'GOOGLE' },
                { email: profile.emails?.[0]?.value },
              ],
            },
          });

          if (!user) {
            // Create new user
            user = await prisma.user.create({
              data: {
                email: profile.emails?.[0]?.value || `google_${profile.id}@temp.com`,
                username: profile.displayName?.replace(/\s+/g, '_').toLowerCase() || `user_${profile.id}`,
                displayName: profile.displayName,
                avatar: profile.photos?.[0]?.value,
                provider: 'GOOGLE',
                providerId: profile.id,
                isVerified: true,
                // Welcome bonus
                cash: 5000,
                point: 1000,
              },
            });
          } else if (!user.providerId) {
            // Link Google account to existing user
            await prisma.user.update({
              where: { id: user.id },
              data: {
                provider: 'GOOGLE',
                providerId: profile.id,
                avatar: profile.photos?.[0]?.value || user.avatar,
              },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// Kakao OAuth Strategy
if (process.env.KAKAO_CLIENT_ID) {
  passport.use(
    new KakaoStrategy(
      {
        clientID: process.env.KAKAO_CLIENT_ID,
        clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
        callbackURL: process.env.KAKAO_CALLBACK_URL || '/api/auth/kakao/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const kakaoAccount = profile._json.kakao_account;
          const email = kakaoAccount?.email;

          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { providerId: profile.id, provider: 'KAKAO' },
                ...(email ? [{ email }] : []),
              ],
            },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: email || `kakao_${profile.id}@temp.com`,
                username: profile.username || `user_${profile.id}`,
                displayName: profile.displayName || kakaoAccount?.profile?.nickname,
                avatar: kakaoAccount?.profile?.profile_image_url,
                provider: 'KAKAO',
                providerId: profile.id,
                isVerified: !!email,
                // Welcome bonus
                cash: 5000,
                point: 1000,
              },
            });
          } else if (!user.providerId) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                provider: 'KAKAO',
                providerId: profile.id,
                avatar: kakaoAccount?.profile?.profile_image_url || user.avatar,
              },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// Serialize user
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
