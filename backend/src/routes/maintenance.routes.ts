import { Router } from 'express';
import {
  getMaintenance,
  getMaintenanceByFactoryId,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getMaintenanceByMachineId,
} from '../controllers/maintenance.controller';
import { jwtAuthMiddleware } from '../config/middleware';

const router: Router = Router();

router.get('/:maintenanceId', jwtAuthMiddleware, getMaintenance);

router.get('/factory/:factoryId', jwtAuthMiddleware, getMaintenanceByFactoryId);

router.post('/', jwtAuthMiddleware, createMaintenance);

router.put('/:maintenanceId', jwtAuthMiddleware, updateMaintenance);

router.delete('/:maintenanceId', jwtAuthMiddleware, deleteMaintenance);

router.get('/machine/:machineId', jwtAuthMiddleware, getMaintenanceByMachineId);

export default router;