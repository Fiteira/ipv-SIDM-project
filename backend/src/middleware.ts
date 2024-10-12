import passport from "passport";
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Middleware de autenticação JWT
export const jwtAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ success: false, message: 'Acesso negado! É preciso um token válido.' });
    }
    req.user = user;
    return next();
  })(req, res, next);
};

// Limitar o acesso para registo
export const limitarAcesso = rateLimit({
  windowMs: 5000, // 5 segundos
  max: 1, // Máximo de 1 requisição
  message: { success: false, message: "Muitas tentativas de registo, tente mais tarde." },
});

// Limitar tentativas de login
export const limitarLogin = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5,
  keyGenerator: (req: Request) => req.body.email, // Limitar com base no email
});
