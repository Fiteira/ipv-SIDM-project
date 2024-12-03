import { Router, Request, Response } from 'express';
import passport from 'passport';
import cacheNode from '../config/cache';
import { login, sensorLogin, resetUserPassword, changeUserPassword } from '../controllers/auth.controller';
import * as middleware from '../config/middleware';
import { jwtAuthMiddleware } from '../config/middleware';

const router: Router = Router();


router.post("/login", middleware.limitLogin, login);

router.post("/loginsensor", sensorLogin);

router.patch("/resetpassword", resetUserPassword);

router.patch("/changepassword/:userNumber", jwtAuthMiddleware, changeUserPassword);

router.get(
  '/checktoken',
  passport.authenticate('jwt', { session: false }),
  (req: Request, res: Response) => {
    if (req.user && (req.user as any).userId) {
      const user = req.user as any;
      const { userId, name, role, factoryId, userNumber } = user;
      const deviceToken = req.headers['devicetoken'];

      if (deviceToken) {
        let cachedUser: any = cacheNode.get(`user_${userId}`) || {};
        cachedUser.deviceToken = deviceToken;
        cacheNode.set(`user_${userId}`, cachedUser);
      } else {
        console.log('Device token não encontrado');
      }

      res.status(200).json({
        success: true,
        message: { userId, name, role, factoryId, userNumber },
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }
  }
);


export default router;