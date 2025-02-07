import { Request, Response } from 'express';
import { AlertModel } from '../models/alert.model';
import { MachineModel } from '../models/machine.model';
import { SensorModel } from '../models/sensor.model';
import { handleServerError } from '../utils/helpers';

export const getAlert = async (req: Request, res: Response): Promise<void> => {
  const { alertId } = req.params;

  try {
    const alert = await AlertModel.findByPk(alertId, {
      include: [
        { model: MachineModel, as: 'machine' }, // Inclui a máquina associada
        { model: SensorModel, as: 'sensor' } // Inclui o sensor
      ]
    });
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
  const { page = 1, limit = 10 } = req.query;

  if (!factoryId) {
    res.status(400).json({ success: false, message: 'FactoryId is required' });
    return;
  }

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const offset = (pageNumber - 1) * limitNumber;

  try {
    const alerts = await AlertModel.findAll({
      include: [
        {
          model: MachineModel, 
          as: 'machine', 
          where: { factoryId }, 
        },
        {
          model: SensorModel, 
          as: 'sensor'
        } 
      ],
      order: [['alertDate', 'DESC']],
      limit: limitNumber,
      offset
    });

    const totalAlerts = await AlertModel.count({
      include: [
        {
          model: MachineModel, 
          as: 'machine', 
          where: { factoryId }, 
        },
        {
          model: SensorModel, 
          as: 'sensor'
        } 
      ]
    });

    const totalPages = Math.ceil(totalAlerts / limitNumber);

    res.status(200).json({
      success: true,
      data: alerts,
      pagination: {
        totalAlerts,
        totalPages,
        currentPage: pageNumber,
        perPage: limitNumber
      }
    });
  } catch (error) {
    handleServerError(res, 'Error fetching alerts', error);
  }
};

export const getAlertByMachineId = async (req: Request, res: Response): Promise<void> => {
  const { machineId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!machineId) {
    res.status(400).json({ success: false, message: 'MachineId is required' });
    return;
  }

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const offset = (pageNumber - 1) * limitNumber;

  try {
    const alerts = await AlertModel.findAll({
      where: { machineId },
      order: [['alertDate', 'DESC']],
      limit: limitNumber,
      offset
    });

    const totalAlerts = await AlertModel.count({
      where: { machineId }
    });

    const totalPages = Math.ceil(totalAlerts / limitNumber);

    res.status(200).json({
      success: true,
      data: alerts,
      pagination: {
        totalAlerts,
        totalPages,
        currentPage: pageNumber,
        perPage: limitNumber
      }
    });
  } catch (error) {
    handleServerError(res, 'Error fetching alerts by MachineId', error);
  }
};

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

    if (machineId) alert.machineId = machineId;
    else if (alertDate) alert.alertDate = alertDate;
    else if (severity) alert.severity = severity;
    else if (message) alert.message = message;

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

export const updateAlertState = async (req: Request, res: Response): Promise<void> => {
  const { alertId } = req.params;
  const { state } = req.body;

  if (!alertId) {
    res.status(400).json({ success: false, message: 'AlertId is required' });
    return;
  }
  if (!state || typeof state !== 'string') {
    res.status(400).json({ success: false, message: 'State is required and must be a string' });
    return;
  }

  try {
    const alert = await AlertModel.findByPk(alertId, { include: { model: MachineModel, as: 'machine' } });
    if (!alert) {
      res.status(404).json({ success: false, message: 'Alert not found' });
      return;
    }

    // Atualiza o estado do alerta
    alert.state = state;
    await alert.save();

    // Caso se esteja a iniciar o processo de manutenção, atualiza o estado da máquina associada para "in maintenance"
    if (state === 'in progress' && alert.machine) {
      alert.machine.state = 'in maintenance';
      await alert.machine.save();
    }

    // Caso se esteja a finalizar o processo de manutenção, atualiza o estado da máquina associada para "active"
    if (state === 'solved' && alert.machine) {
      alert.machine.state = 'active';
      await alert.machine.save();
    }

    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    handleServerError(res, 'Error updating alert state', error);
  }
};