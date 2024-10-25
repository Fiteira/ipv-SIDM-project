import { Request, Response } from 'express';
import { FactoryModel } from '../models/factory.model';
import { handleServerError } from '../utils/helpers';

// Obter uma fábrica pelo ID
export const getFactory = async (req: Request, res: Response): Promise<void> => {
  const { factoryId } = req.params;
  if (!factoryId) {
    res.status(400).json({ success: false, message: 'FactoryId is required' });
    return;
  }
  try {
    const factory = await FactoryModel.findByPk(factoryId);
    if (!factory) {
      res.status(404).json({ success: false, message: 'Factory not found' });
      return;
    }
    res.status(200).json({ success: true, data: factory });
  } catch (error) {
    handleServerError(res, 'Error fetching factory', error);
  }
};

// Obter todas as fábricas
export const getAllFactories = async (req: Request, res: Response): Promise<void> => {
  try {
    const factories = await FactoryModel.findAll();
    res.status(200).json({ success: true, data: factories });
  } catch (error) {
    handleServerError(res, 'Error fetching factories', error);
  }
};

// Criar uma nova fábrica
export const createFactory = async (req: Request, res: Response): Promise<void> => {
  const { factoryName, location } = req.body;
  if (!factoryName || !location) {
    res.status(400).json({ success: false, message: 'FactoryName and location are required' });
    return;
  }
  try {
    const newFactory = await FactoryModel.create({ factoryName, location });
    res.status(201).json({ success: true, data: newFactory });
  } catch (error) {
    handleServerError(res, 'Error creating factory', error);
  }
};

// Atualizar uma fábrica existente
export const updateFactory = async (req: Request, res: Response): Promise<void> => {
  const { factoryId } = req.params;
  const { factoryName, location } = req.body;

  try {
    const factory = await FactoryModel.findByPk(factoryId);
    if (!factory) {
      res.status(404).json({ success: false, message: 'Factory not found' });
      return;
    }

    factory.factoryName = factoryName;
    factory.location = location;

    await factory.save();
    res.status(200).json({ success: true, data: factory });
  } catch (error) {
    handleServerError(res, 'Error updating factory', error);
  }
};

// Deletar uma fábrica
export const deleteFactory = async (req: Request, res: Response): Promise<void> => {
  const { factoryId } = req.params;
  if (!factoryId) {
    res.status(400).json({ success: false, message: 'FactoryId is required' });
    return;
  }

  try {
    const factory = await FactoryModel.findByPk(factoryId);
    if (!factory) {
      res.status(404).json({ success: false, message: 'Factory not found' });
      return;
    }

    await factory.destroy();
    res.status(200).json({ success: true, message: 'Factory deleted successfully' });
  } catch (error) {
    handleServerError(res, 'Error deleting factory', error);
  }
};