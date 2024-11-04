import { Request, Response } from 'express';
import { AlertModel } from '../models/alert.model';
import { MachineModel } from '../models/machine.model';
import { handleServerError } from '../utils/helpers';

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


export const getAllAlertsByFactoryId = async (req: Request, res: Response): Promise<void> => {
  const { factoryId } = req.params;
  if (!factoryId) {
    res.status(400).json({ success: false, message: 'FactoryId is required' });
    return;
  }
  try {
    const alerts = await AlertModel.findAll( { include: { model: MachineModel, as: 'machine', where: { factoryId } } });
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    handleServerError(res, 'Error fetching alerts', error);
  }
};


export const getAlertByMachineId = async (req: Request, res: Response): Promise<void> => {
    const { machineId } = req.params;
    if (!machineId) {
      res.status(400).json({ success: false, message: 'MachineId is required' });
      return;
    }
  
    try {
      const alerts = await AlertModel.findAll({ where: { machineId: machineId } });

      if (!alerts.length) {
        res.status(404).json({ success: false, message: 'No alerts found for this machine' });
        return;
      }

      res.status(200).json({ success: true, data: alerts });

    } catch (error) {
      handleServerError(res, 'Error fetching alerts by MachineId', error);
    }
}

export const createAlert = async (req: Request, res: Response): Promise<void> => {
  const { machineId, alertDate, severity, message } = req.body;
  if (!machineId || !alertDate || !severity || !message) {
    res.status(400).json({ success: false, message: 'MachineId, alertDate, severity, and message are required' });
    return;
  }
  try {
    const newAlert = await AlertModel.create({ machineId, alertDate, severity, message });
    res.status(201).json({ success: true, data: newAlert });
  } catch (error) {
    handleServerError(res, 'Error creating alert', error);
  }
};

export const updateAlert = async (req: Request, res: Response): Promise<void> => {
  const { alertId } = req.params;
  const { machineId, alertDate, severity, message } = req.body;
  if (!machineId || !alertDate || !severity || !message) {
    res.status(400).json({ success: false, message: 'MachineId, alertDate, severity, and message are required' });
    return;
  } else if (!alertId) {
    res.status(400).json({ success: false, message: 'AlertId is required' });
    return;
  }

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

export const deleteAlert = async (req: Request, res: Response): Promise<void> => {
  const { alertId } = req.params;
  if (!alertId) {
    res.status(400).json({ success: false, message: 'AlertId is required' });
    return;
  }
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
