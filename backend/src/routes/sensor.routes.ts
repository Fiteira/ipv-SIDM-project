import { Router } from 'express';
import {
  getSensor,
  getAllSensorsByFactoryId,
  createSensor,
  updateSensor,
  deleteSensor,
  getSensorsByMachineId,
} from '../controllers/sensor.controller';

const router: Router = Router();

router.get('/:sensorId', getSensor);

router.get('/factory/:factoryId', getAllSensorsByFactoryId);

router.post('/', createSensor);

router.put('/:sensorId', updateSensor);

router.delete('/:sensorId', deleteSensor);

router.get('/machine/:machineId', getSensorsByMachineId);

export default router;
