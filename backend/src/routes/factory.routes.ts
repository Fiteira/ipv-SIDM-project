import { Router } from 'express';
import {
  getFactory,
  createFactory,
  updateFactory,
  deleteFactory,
} from '../controllers/factory.controller';

const router: Router = Router();

// Rota para obter uma fábrica pelo ID
router.get('/:factoryId', getFactory);

// Rota para criar uma nova fábrica
router.post('/', createFactory);

// Rota para atualizar uma fábrica existente
router.put('/:factoryId', updateFactory);

// Rota para deletar uma fábrica
router.delete('/:factoryId', deleteFactory);

export default router;
