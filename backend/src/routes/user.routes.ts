import { Router } from 'express';
import {
  getUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/user.controller';

const router: Router = Router();


router.get('/:userId', getUser);

router.get('/', getAllUsers);

router.post('/', createUser);

router.put('/:userId', updateUser);

router.delete('/:userId', deleteUser);


export default router;
