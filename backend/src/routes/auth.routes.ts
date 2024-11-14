import { Router, Request, Response } from 'express';
import passport from 'passport';
import cacheNode from '../config/cache';
import { login, sensorLogin, resetUserPassword } from '../controllers/auth.controller';
import * as middleware from '../config/middleware';

const router: Router = Router();


router.post("/login", middleware.limitLogin, login);

router.post("/loginsensor", sensorLogin);

router.post("/resetpassword", resetUserPassword);

router.get(
  '/checktoken',
  passport.authenticate('jwt', { session: false }),
  (req: Request, res: Response) => {
    if (req.user && (req.user as any).dataValues.userId) {
      const user = (req.user as any).dataValues;
      const { userId, name, role, factoryId } = user;
      const deviceToken = req.headers['devicetoken']
      if (deviceToken) {
        let user: any = cacheNode.get(`user_${userId}`)
        user.deviceToken = deviceToken
        cacheNode.del(`user_${userId}`)
        cacheNode.set(`user_${userId}`, user)
      } else{
        console.log("Device token não encontrado")
      }
      res.status(200).json({
        success: true,
        message: { userId, name, role, factoryId },
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