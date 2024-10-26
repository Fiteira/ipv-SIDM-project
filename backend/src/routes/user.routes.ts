import { Router } from 'express';
import {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserByFactoryId,
} from '../controllers/user.controller';

const router: Router = Router();

router.get('/:userId', getUser);

router.post('/', createUser);

router.put('/:userId', updateUser);

router.delete('/:userId', deleteUser);

router.get('/factory/:factoryId', getUserByFactoryId);

export default router;
