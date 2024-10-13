import { Router } from 'express';
import {
  getSensor,
  createSensor,
  updateSensor,
  deleteSensor,
  getSensorsByMachineId,
} from '../controllers/sensor.controller';

const router: Router = Router();

// Rota para obter um sensor pelo ID
router.get('/:sensorId', getSensor);

// Rota para criar um novo sensor
router.post('/', createSensor);

// Rota para atualizar um sensor existente
router.put('/:sensorId', updateSensor);

// Rota para deletar um sensor
router.delete('/:sensorId', deleteSensor);

// Rota para obter todos os sensores de uma máquina
router.get('/machine/:machineId', getSensorsByMachineId);

export default router;
