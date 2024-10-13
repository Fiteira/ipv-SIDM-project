import { Router, Request, Response } from 'express';
import passport from 'passport';
import { login } from '../controllers/auth.controller';
import * as middleware from '../config/middleware';

const router: Router = Router();


// Rota para login
router.post("/login", middleware.limitLogin, login);

// Rota para verificar token
router.get('/checktoken', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {
  if (req.user) {
    const { userId, userName, roleId, companyId, email, status } = (req.user as any).dataValues;
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

export default router;