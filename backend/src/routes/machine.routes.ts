import { Router } from 'express';
import {
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine,
  getMachinesByFactoryId,
} from '../controllers/machine.controller';
import { jwtAuthMiddleware } from '../config/middleware';

const router: Router = Router();

router.get('/:machineId', jwtAuthMiddleware, getMachine);

router.post('/', jwtAuthMiddleware, createMachine);

router.put('/:machineId', jwtAuthMiddleware, updateMachine);

router.delete('/:machineId', jwtAuthMiddleware, deleteMachine);

router.get('/factory/:factoryId', jwtAuthMiddleware, getMachinesByFactoryId);

export default router;
