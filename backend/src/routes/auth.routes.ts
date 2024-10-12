import { Router } from 'express';
import { login, register } from '../controllers/auth.controller';
import { jwtAuthMiddleware } from '../config/middleware';
import passport from 'passport';

const router = Router();

// Rota de login
router.post("/login", login);

// Rota de registo
router.post("/register", register);


// Exemplo de rota protegida com JWT
router.get('/checktoken', passport.authenticate('jwt', { session: false }), (req, res) => {
    if (req.user) {
      const { userId, userName, password, status } = req.user as any; // Ajuste o tipo conforme necessário
      res.status(200).json({ success: true, userId, userName, status });
    } else {
      res.status(401).json({ success: false, message: 'Utilizador não autenticado' });
    }
  });
  
  export default router;