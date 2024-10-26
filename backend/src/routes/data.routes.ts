import { Router } from 'express';
import {
  getData,
  createData,
  updateData,
  deleteData,
  getDataBySensorId,
} from '../controllers/data.controller';

const router: Router = Router();

router.get('/:dataId', getData);

router.post('/', createData);

router.put('/:dataId', updateData);

router.delete('/:dataId', deleteData);

router.get('/sensor/:sensorId', getDataBySensorId);

export default router;
