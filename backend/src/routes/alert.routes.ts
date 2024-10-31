import { Router } from 'express';
import {
  getAlert,
  getAllAlertsByFactoryId,
  createAlert,
  updateAlert,
  deleteAlert,
  getAlertByMachineId,
} from '../controllers/alert.controller';

const router: Router = Router();

router.get('/:alertId', getAlert);

router.get('/factory/:factoryId', getAllAlertsByFactoryId);

router.post('/', createAlert);

router.put('/:alertId', updateAlert);

router.delete('/:alertId', deleteAlert);

router.get('/machine/:machineId', getAlertByMachineId);
;

export default router;
