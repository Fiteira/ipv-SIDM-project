import { Router } from 'express';
import {
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getMaintenanceByMachineId,
} from '../controllers/maintenance.controller';

const router: Router = Router();

// Rota para obter uma manutenção pelo ID
router.get('/:maintenanceId', getMaintenance);

// Rota para criar uma nova manutenção
router.post('/', createMaintenance);

// Rota para atualizar uma manutenção existente
router.put('/:maintenanceId', updateMaintenance);

// Rota para deletar uma manutenção
router.delete('/:maintenanceId', deleteMaintenance);

// Rota para obter todas as manutenções de uma máquina
router.get('/machine/:machineId', getMaintenanceByMachineId);

export default router;