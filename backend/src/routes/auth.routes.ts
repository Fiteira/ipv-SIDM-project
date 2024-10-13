import { Express, Router, Request, Response } from 'express';
import passport from 'passport';
import { login } from '../controllers/auth.controller';
import * as middleware from '../config/middleware';

const authRoutes = (app: Express) => {
  const router: Router = Router();

  // Route for login
  router.post("/login", middleware.limitAccess, login);

  // Route to check token
  router.get('/checktoken', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {
    if (req.user) {
      const { userId, userName, roleId, companyId, email, status } = (req.user as any).dataValues;  // casting to `any` to access `dataValues`
      res.status(200).json({
        success: true,
        message: { userId, userName, roleId, companyId, email, status }
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
  });

  // Use the router under the /api route
  app.use("/api", router);
};

export default authRoutes;
