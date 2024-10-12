const passport = require("passport");
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
const UserModel = require("../models/user.model");
const cache = require("./cache");
require('dotenv').config();

const jwtOptions  = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY || 'secret', 
};

passport.use(new JwtStrategy(jwtOptions ,async (jwtPayload: any, done: any) => {

  try {
    let user = await cache.get(jwtPayload.id);
    if (!user) {
      console.log("User não está em cache, obtendo do banco de dados...");
      // Se o user não está em cache, obtém do banco de dados
      user = await UserModel.findByPk(jwtPayload.id, {
        attributes: ['userId', 'roleId', 'companyId', 'email', 'userName', 'status']
      });
      // Armazena o user em cache por 4 minutos
      cache.set(jwtPayload.id, user, 240);
    }
    
    return done(null, user);
    
  } catch (err) {
    return done(err, false);
  }
}));

module.exports = passport;