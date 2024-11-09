import { Router } from 'express';
import {
  getFactory,
  getAllFactories,
  createFactory,
  updateFactory,
  deleteFactory,
} from '../controllers/factory.controller';
import { jwtAuthMiddleware } from '../config/middleware';

const router: Router = Router();

router.get('/:factoryId', jwtAuthMiddleware, getFactory);

router.get('/', jwtAuthMiddleware, getAllFactories);

router.post('/', jwtAuthMiddleware, createFactory);

router.put('/:factoryId', jwtAuthMiddleware, updateFactory);

router.delete('/:factoryId', jwtAuthMiddleware, deleteFactory);

export default router;
