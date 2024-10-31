import { Router } from 'express';
import {
  getFactory,
  getAllFactories,
  createFactory,
  updateFactory,
  deleteFactory,
} from '../controllers/factory.controller';

const router: Router = Router();

router.get('/:factoryId', getFactory);

router.get('/', getAllFactories);

router.post('/', createFactory);

router.put('/:factoryId', updateFactory);

router.delete('/:factoryId', deleteFactory);

export default router;
