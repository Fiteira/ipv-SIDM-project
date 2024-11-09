import { Router } from 'express';
import {
  getUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUsersByFactoryId
} from '../controllers/user.controller';
import { jwtAuthMiddleware } from '../config/middleware';

const router: Router = Router();


router.get('/:userNumber', jwtAuthMiddleware, getUser);

router.get('/', jwtAuthMiddleware, getAllUsers);

router.get('/factory/:factoryId', jwtAuthMiddleware, getUsersByFactoryId);

router.post('/', jwtAuthMiddleware, createUser);

router.put('/:userId', jwtAuthMiddleware, updateUser);

router.delete('/:userId', jwtAuthMiddleware, deleteUser);


export default router;
