import { Request, Response } from 'express';
import { MachineModel } from '../models/machine.model';
import { handleServerError } from '../utils/helpers';

export const getMachine = async (req: Request, res: Response): Promise<void> => {
  const { machineId } = req.params;
  if (!machineId) {
    res.status(400).json({ success: false, message: 'MachineId is required' });
    return;
  }
  try {
    const machine = await MachineModel.findByPk(machineId);
    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }
    res.status(200).json({ success: true, data: machine });
  } catch (error) {
    handleServerError(res, 'Error fetching machine', error);
  }
};

export const getMachinesByFactoryId = async (req: Request, res: Response): Promise<void> => {
  const { factoryId } = req.params;
  if (!factoryId) {
    res.status(400).json({ success: false, message: 'FactoryId is required' });
    return;
  }
  try {
    const machines = await MachineModel.findAll({ where: { factoryId } });
    res.status(200).json({ success: true, data: machines });
  } catch (error) {
    handleServerError(res, 'Error fetching machines by factoryId', error);
  }
};

export const createMachine = async (req: Request, res: Response): Promise<void> => {
  const { machineName, factoryId } = req.body;
  if (!machineName || !factoryId) {
    res.status(400).json({ success: false, message: 'MachineName and factoryId are required' });
    return;
  }

  try {
    const newMachine = await MachineModel.create({ machineName, factoryId });
    res.status(201).json({ success: true, data: newMachine });
  } catch (error) {
    handleServerError(res, 'Error creating machine', error);
  }
};

export const updateMachine = async (req: Request, res: Response): Promise<void> => {
  const { machineId } = req.params;
  const { machineName, factoryId } = req.body;

  if (!machineId) {
    res.status(400).json({ success: false, message: 'MachineId is required' });
    return;
  }

  try {
    const machine = await MachineModel.findByPk(machineId);
    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }

    if (machineName) machine.machineName = machineName;
    else if (factoryId) machine.factoryId = factoryId;
 

    await machine.save();
    res.status(200).json({ success: true, data: machine });
  } catch (error) {
    handleServerError(res, 'Error updating machine', error);
  }
};

export const deleteMachine = async (req: Request, res: Response): Promise<void> => {
  const { machineId } = req.params;
  if (!machineId) {
    res.status(400).json({ success: false, message: 'MachineId is required' });
    return;
  }
  try {
    const machine = await MachineModel.findByPk(machineId);
    if (!machine) {
      res.status(404).json({ success: false, message: 'Machine not found' });
      return;
    }

    await machine.destroy();
    res.status(200).json({ success: true, message: 'Machine deleted successfully' });
  } catch (error) {
    handleServerError(res, 'Error deleting machine', error);
  }
};
