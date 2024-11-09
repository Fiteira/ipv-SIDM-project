import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import dotenv from 'dotenv';
import { UserModel } from '../models/user.model';
import cache from './cache';

dotenv.config();

const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY as string,
};

// Configure Passport JWT strategy
passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload: any, done: (error: any, user?: any, info?: any) => void) => {
    try {
      let user = cache.get(`user_${jwtPayload.userId}`);

      if (!user) {

        user = await UserModel.findByPk(jwtPayload.userId, {
          attributes: ['userId', 'role', 'factoryId', 'name', 'userNumber'],
        });

        if (user) {
          cache.set(`user_${jwtPayload.userId}`, user);
        } else {
          console.log("User not found in database.");
        }
      } else {
        console.log("User found in cache.");
      }

      return done(null, user || false);
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;
