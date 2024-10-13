import { Request, Response } from 'express';
import { AlertModel } from '../models/alert.model';
import { MachineModel } from '../models/machine.model';
import { handleServerError } from '../utils/helpers';

// Obter um alerta pelo ID
export const getAlert = async (req: Request, res: Response): Promise<void> => {
  const { alertId } = req.params;

  try {
    const alert = await AlertModel.findByPk(alertId);
    if (!alert) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }
    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    handleServerError(res, 'Error fetching alert', error);
  }
};

// Obter todos os alertas por userId
export const getAlertByUserId = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;
  
    try {
      // Buscar as máquinas associadas ao usuário
      const machines = await MachineModel.findAll({ where: { userId } });
  
      if (!machines.length) {
        res.status(404).json({ success: false, message: 'No machines found for this user' });
        return;
      }
  
      // Buscar alertas associados às máquinas encontradas
      const machineIds = machines.map(machine => machine.machineId);
      const alerts = await AlertModel.findAll({ where: { machineId: machineIds } });
  
      if (!alerts.length) {
        res.status(404).json({ success: false, message: 'No alerts found for this user' });
        return;
      }
  
      res.status(200).json({ success: true, data: alerts });
    } catch (error) {
      handleServerError(res, 'Error fetching alerts by userId', error);
    }
  };

// Criar um novo alerta
export const createAlert = async (req: Request, res: Response): Promise<void> => {
  const { machineId, alertDate, severity, message } = req.body;

  try {
    const newAlert = await AlertModel.create({ machineId, alertDate, severity, message });
    res.status(201).json({ success: true, data: newAlert });
  } catch (error) {
    handleServerError(res, 'Error creating alert', error);
  }
};

// Atualizar um alerta existente
export const updateAlert = async (req: Request, res: Response): Promise<void> => {
  const { alertId } = req.params;
  const { machineId, alertDate, severity, message } = req.body;

  try {
    const alert = await AlertModel.findByPk(alertId);
    if (!alert) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    alert.machineId = machineId;
    alert.alertDate = alertDate;
    alert.severity = severity;
    alert.message = message;

    await alert.save();
    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    handleServerError(res, 'Error updating alert', error);
  }
};

// Deletar um alerta
export const deleteAlert = async (req: Request, res: Response): Promise<void> => {
  const { alertId } = req.params;

  try {
    const alert = await AlertModel.findByPk(alertId);
    if (!alert) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    await alert.destroy();
    res.status(200).json({ success: true, message: 'Alert deleted successfully' });
  } catch (error) {
    handleServerError(res, 'Error deleting alert', error);
  }
};
