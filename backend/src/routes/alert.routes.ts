import { Router } from 'express';
import {
  getAlert,
  createAlert,
  updateAlert,
  deleteAlert,
  getAlertByMachineId,
  getAlertByUserId
} from '../controllers/alert.controller';

const router: Router = Router();

router.get('/:alertId', getAlert);

router.post('/', createAlert);

router.put('/:alertId', updateAlert);

router.delete('/:alertId', deleteAlert);

router.get('/user/:userId', getAlertByMachineId);

router.get('/user/:userId', getAlertByUserId);

export default router;
