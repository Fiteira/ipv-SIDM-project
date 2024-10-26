import { Request, Response } from 'express';
import { MaintenanceModel } from '../models/maintenance.model';
import { handleServerError } from '../utils/helpers';

export const getMaintenance = async (req: Request, res: Response): Promise<void> => {
  const { maintenanceId } = req.params;
  if (!maintenanceId) {
    res.status(400).json({ success: false, message: 'MaintenanceId is required' });
    return;
  }
  try {
    const maintenance = await MaintenanceModel.findByPk(maintenanceId);
    if (!maintenance) {
      res.status(404).json({ success: false, message: 'Maintenance not found' });
      return;
    }
    res.status(200).json({ success: true, data: maintenance });
  } catch (error) {
    handleServerError(res, 'Error fetching maintenance', error);
  }
};

export const getMaintenanceByMachineId = async (req: Request, res: Response): Promise<void> => {
    const { machineId } = req.params;
    if (!machineId) {
      res.status(400).json({ success: false, message: 'MachineId is required' });
      return;
    }
    try {
      const maintenances = await MaintenanceModel.findAll({ where: { machineId } });
      if (!maintenances.length) {
        res.status(404).json({ success: false, message: 'No maintenance records found for this machine' });
        return;
      }
      res.status(200).json({ success: true, data: maintenances });
    } catch (error) {
      handleServerError(res, 'Error fetching maintenances by machineId', error);
    }
  };

export const createMaintenance = async (req: Request, res: Response): Promise<void> => {
    const { machineId, maintenanceDate, description, performedBy } = req.body;
    if (!machineId || !maintenanceDate || !description || !performedBy) {
      res.status(400).json({ success: false, message: 'MachineId, maintenanceDate, description, and performedBy are required' });
      return;
    }
    try {
      const newMaintenance = await MaintenanceModel.create({ machineId, maintenanceDate, description, performedBy });
      res.status(201).json({ success: true, data: newMaintenance });
    } catch (error) {
      handleServerError(res, 'Error creating maintenance', error);
    }
  };

export const updateMaintenance = async (req: Request, res: Response): Promise<void> => {
    const { maintenanceId } = req.params;
    const { machineId, maintenanceDate, description, performedBy } = req.body;
  
    try {
      const maintenance = await MaintenanceModel.findByPk(maintenanceId);
      if (!maintenance) {
        res.status(404).json({ success: false, message: 'Maintenance not found' });
        return;
      }
  
      maintenance.machineId = machineId;
      maintenance.maintenanceDate = maintenanceDate;
      maintenance.description = description;
      maintenance.performedBy = performedBy;
  
      await maintenance.save();
      res.status(200).json({ success: true, data: maintenance });
    } catch (error) {
      handleServerError(res, 'Error updating maintenance', error);
    }
  };

export const deleteMaintenance = async (req: Request, res: Response): Promise<void> => {
  const { maintenanceId } = req.params;
  if (!maintenanceId) {
    res.status(400).json({ success: false, message: 'MaintenanceId is required' });
    return;
  }
  try {
    const maintenance = await MaintenanceModel.findByPk(maintenanceId);
    if (!maintenance) {
      res.status(404).json({ success: false, message: 'Maintenance not found' });
      return;
    }

    await maintenance.destroy();
    res.status(200).json({ success: true, message: 'Maintenance deleted successfully' });
  } catch (error) {
    handleServerError(res, 'Error deleting maintenance', error);
  }
};
