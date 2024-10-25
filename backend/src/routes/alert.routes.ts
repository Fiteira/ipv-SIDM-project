import { Router } from 'express';
import {
  getAlert,
  createAlert,
  updateAlert,
  deleteAlert,
  getAlertByMachineId,
} from '../controllers/alert.controller';

const router: Router = Router();

// Rota para obter um alerta pelo ID
router.get('/:alertId', getAlert);

// Rota para criar um novo alerta
router.post('/', createAlert);

// Rota para atualizar um alerta existente
router.put('/:alertId', updateAlert);

// Rota para deletar um alerta
router.delete('/:alertId', deleteAlert);

// Rota para obter todos os alertas por userId
router.get('/user/:userId', getAlertByMachineId);

export default router;
