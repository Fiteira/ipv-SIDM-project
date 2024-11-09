import { Router } from 'express';
import {
  getData,
  createData,
  updateData,
  deleteData,
  getDataBySensorId,
} from '../controllers/data.controller';
import { jwtAuthMiddleware } from '../config/middleware';

const router: Router = Router();

router.get('/:dataId', jwtAuthMiddleware, getData);

router.post('/', jwtAuthMiddleware, createData);

router.put('/:dataId', jwtAuthMiddleware, updateData);

router.delete('/:dataId', jwtAuthMiddleware, deleteData);

router.get('/sensor/:sensorId', jwtAuthMiddleware, getDataBySensorId);

export default router;
