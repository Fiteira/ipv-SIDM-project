import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import dotenv from 'dotenv';
import { UserModel } from '../models/user.model';
import cache from './cache';

dotenv.config();

const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY || 'secret', 
};

// Configure Passport JWT strategy
passport.use(new JwtStrategy(jwtOptions, async (jwtPayload: any, done: (error: any, user?: any, info?: any) => void) => {
  try {
    // Try to fetch the user from the cache
    let user = await cache.get(jwtPayload.id);

    if (!user) {
      console.log("User not found in cache, fetching from database...");
      
      // If user is not in cache, fetch from the database
      user = await UserModel.findByPk(jwtPayload.id, {
        attributes: ['userId', 'roleId', 'companyId', 'email', 'userName', 'status']
      });

      // Store the user in cache for 4 minutes (240 seconds)
      cache.set(jwtPayload.id, user, 240);
    }

    return done(null, user);
  } catch (err) {
    return done(err, false);
  }
}));

export default passport;
