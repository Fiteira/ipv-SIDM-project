import { Router } from 'express';
import {
  getSensor,
  getAllSensorsByFactoryId,
  createSensor,
  updateSensor,
  deleteSensor,
  getSensorsByMachineId,
} from '../controllers/sensor.controller';
import { jwtAuthMiddleware } from '../config/middleware';

const router: Router = Router();

router.get('/:sensorId', jwtAuthMiddleware, getSensor);

router.get('/factory/:factoryId', jwtAuthMiddleware, getAllSensorsByFactoryId);

router.post('/', jwtAuthMiddleware, createSensor);

router.put('/:sensorId', jwtAuthMiddleware, updateSensor);

router.delete('/:sensorId', jwtAuthMiddleware, deleteSensor);

router.get('/machine/:machineId', jwtAuthMiddleware, getSensorsByMachineId);

export default router;
