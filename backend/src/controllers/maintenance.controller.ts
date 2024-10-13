import { Request, Response } from 'express';
import { MaintenanceModel } from '../models/maintenance.model';
import { handleServerError } from '../utils/helpers';

// Obter manutenção pelo ID
export const getMaintenance = async (req: Request, res: Response): Promise<void> => {
  const { maintenanceId } = req.params;

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

// Obter todas as manutenções por machineId
export const getMaintenanceByMachineId = async (req: Request, res: Response): Promise<void> => {
    const { machineId } = req.params;
  
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

// Criar nova manutenção
export const createMaintenance = async (req: Request, res: Response): Promise<void> => {
    const { machineId, maintenanceDate, description, performedBy } = req.body;
  
    try {
      const newMaintenance = await MaintenanceModel.create({ machineId, maintenanceDate, description, performedBy });
      res.status(201).json({ success: true, data: newMaintenance });
    } catch (error) {
      handleServerError(res, 'Error creating maintenance', error);
    }
  };

// Atualizar manutenção existente
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

// Deletar uma manutenção
export const deleteMaintenance = async (req: Request, res: Response): Promise<void> => {
  const { maintenanceId } = req.params;

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
