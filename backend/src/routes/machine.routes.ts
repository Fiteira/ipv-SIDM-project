import { Router } from 'express';
import {
  getMachine,
  createMachine,
  updateMachine,
  deleteMachine,
  getMachinesByFactoryId,
} from '../controllers/machine.controller';

const router: Router = Router();

// Rota para obter uma máquina pelo ID
router.get('/:machineId', getMachine);

// Rota para criar uma nova máquina
router.post('/', createMachine);

// Rota para atualizar uma máquina existente
router.put('/:machineId', updateMachine);

// Rota para deletar uma máquina
router.delete('/:machineId', deleteMachine);

// Rota para obter todas as máquinas de uma fábrica
router.get('/factory/:factoryId', getMachinesByFactoryId);

export default router;
