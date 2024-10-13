import { Router } from 'express';
import {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserByFactoryId,
} from '../controllers/user.controller';

const router: Router = Router();

// Rota para obter um usuário pelo ID
router.get('/:userId', getUser);

// Rota para criar um novo usuário
router.post('/', createUser);

// Rota para atualizar um usuário existente
router.put('/:userId', updateUser);

// Rota para deletar um usuário
router.delete('/:userId', deleteUser);

// Rota para obter todos os usuários de uma fábrica
router.get('/factory/:factoryId', getUserByFactoryId);

export default router;
