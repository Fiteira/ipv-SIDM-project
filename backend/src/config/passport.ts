import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import dotenv from 'dotenv';
import { UserModel } from '../models/user.model';
import { SensorModel } from '../models/sensor.model';
import { MachineModel } from '../models/machine.model';
import { FactoryModel } from '../models/factory.model';
import cache from './cache';

dotenv.config();

const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET_KEY as string,
};

// Configure Passport JWT strategy
passport.use(
  new JwtStrategy(jwtOptions, async (jwtPayload: any, done: (error: any, userOrSensor?: any) => void) => {
    try {
      if (jwtPayload.userId) {
        // User authentication
        let user = cache.get(`user_${jwtPayload.userId}`);
        if (!user) {
          user = await UserModel.findByPk(jwtPayload.userId, {
            attributes: ['userId', 'role', 'factoryId', 'name', 'userNumber'],
          });
          if (user) {
            cache.set(`user_${jwtPayload.userId}`, user);
          }
        }
        return done(null, user || false);
      } else if (jwtPayload.sensorId) {
        // Sensor authentication
        let sensor = cache.get(`sensor_${jwtPayload.sensorId}`);
        if (!sensor) {
          sensor = await SensorModel.findByPk(jwtPayload.sensorId, {
            include: [
              {
                model: MachineModel,
                as: 'machine',
                attributes: ['machineId', 'machineName', 'factoryId'],
                include: [
                  {
                    model: FactoryModel,
                    as: 'factory',
                    attributes: ['factoryId', 'factoryName', 'location'],
                  },
                ],
              },
            ],
          });
          if (sensor) {
            cache.set(`sensor_${jwtPayload.sensorId}`, sensor);
          }
        }
        return done(null, sensor || false);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

export default passport;
