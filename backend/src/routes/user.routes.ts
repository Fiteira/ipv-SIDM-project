import { Router } from 'express';
import {
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getAllUser
} from '../controllers/user.controller';

const router: Router = Router();

router.get('/:userId', getAllUser);

router.get('/:userId', getUser);

router.post('/', createUser);

router.put('/:userId', updateUser);

router.delete('/:userId', deleteUser);


export default router;
