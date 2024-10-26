import { Router } from 'express';
import {
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine,
  getMachinesByFactoryId,
} from '../controllers/machine.controller';

const router: Router = Router();

router.get('/:machineId', getMachine);

router.post('/', createMachine);

router.put('/:machineId', updateMachine);

router.delete('/:machineId', deleteMachine);

router.get('/factory/:factoryId', getMachinesByFactoryId);

export default router;
