import { Router } from 'express';
import {
  getMaintenance,
  getMaintenanceByFactoryId,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getMaintenanceByMachineId,
} from '../controllers/maintenance.controller';

const router: Router = Router();

router.get('/:maintenanceId', getMaintenance);

router.get('/factory/:factoryId', getMaintenanceByFactoryId);

router.post('/', createMaintenance);

router.put('/:maintenanceId', updateMaintenance);

router.delete('/:maintenanceId', deleteMaintenance);

router.get('/machine/:machineId', getMaintenanceByMachineId);

export default router;