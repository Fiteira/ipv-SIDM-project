import { Router } from 'express';
import {
  getData,
  createData,
  updateData,
  deleteData,
  getDataBySensorId,
} from '../controllers/data.controller';

const router: Router = Router();

// Rota para obter um dado pelo ID
router.get('/:dataId', getData);

// Rota para criar um novo dado
router.post('/', createData);

// Rota para atualizar um dado existente
router.put('/:dataId', updateData);

// Rota para deletar um dado
router.delete('/:dataId', deleteData);

// Rota para obter todos os dados de um sensor
router.get('/sensor/:sensorId', getDataBySensorId);

export default router;
