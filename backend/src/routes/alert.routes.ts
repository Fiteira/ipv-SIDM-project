import { Router } from 'express';
import {
  getAlert,
  getAllAlertsByFactoryId,
  createAlert,
  updateAlert,
  deleteAlert,
  getAlertByMachineId,
  updateAlertState,
} from '../controllers/alert.controller';
import { jwtAuthMiddleware } from '../config/middleware';

const router: Router = Router();

router.get('/:alertId', jwtAuthMiddleware, getAlert);

router.get('/factory/:factoryId', jwtAuthMiddleware, getAllAlertsByFactoryId);

router.post('/', jwtAuthMiddleware, createAlert);

router.put('/:alertId', jwtAuthMiddleware, updateAlert);

router.delete('/:alertId', jwtAuthMiddleware, deleteAlert);

router.get('/machine/:machineId', jwtAuthMiddleware, getAlertByMachineId);

router.patch('/state/:alertId', jwtAuthMiddleware, updateAlertState);

export default router;
