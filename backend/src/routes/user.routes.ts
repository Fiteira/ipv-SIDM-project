import { Router } from 'express';
import {
  getUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserByFactoryId,
} from '../controllers/user.controller';

const router: Router = Router();

router.get('/:userId', getUser);

router.get('/', getAllUsers);

router.post('/', createUser);

router.put('/:userId', updateUser);

router.delete('/:userId', deleteUser);

router.get('/factory/:factoryId', getUserByFactoryId);

export default router;
