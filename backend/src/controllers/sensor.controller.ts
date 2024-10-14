import { Request, Response } from 'express';
import { SensorModel } from '../models/sensor.model';
import { handleServerError } from '../utils/helpers';

// Obter um sensor pelo ID
export const getSensor = async (req: Request, res: Response): Promise<void> => {
  const { sensorId } = req.params;

  try {
    const sensor = await SensorModel.findByPk(sensorId);
    if (!sensor) {
      res.status(404).json({ success: false, message: 'Sensor not found' });
      return;
    }
    res.status(200).json({ success: true, data: sensor });
  } catch (error) {
    handleServerError(res, 'Error fetching sensor', error);
  }
};

// Obter todos os sensores por machineId
export const getSensorsByMachineId = async (req: Request, res: Response): Promise<void> => {
    const { machineId } = req.params;
  
    try {
      const sensors = await SensorModel.findAll({ where: { machineId } });
      if (!sensors.length) {
        res.status(404).json({ success: false, message: 'No sensors found for this machine' });
        return;
      }
      res.status(200).json({ success: true, data: sensors });
    } catch (error) {
      handleServerError(res, 'Error fetching sensors by machineId', error);
    }
  };

// Criar um novo sensor
export const createSensor = async (req: Request, res: Response): Promise<void> => {
  const { name, sensorType, machineId } = req.body;
  if (!name || !sensorType || !machineId) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return
  }
  let apiKey: string = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  console.log("APIKEY do sensor: ", apiKey);
  try {
    if (apiKey) {
      const newSensor = await SensorModel.create({ name, sensorType, machineId, apiKey });
      res.status(201).json({ success: true, data: newSensor });
    }
  } catch (error) {
    handleServerError(res, 'Error creating sensor', error);
  }
};

// Atualizar um sensor existente
export const updateSensor = async (req: Request, res: Response): Promise<void> => {
  const { sensorId } = req.params;
  const { sensorType, machineId } = req.body;

  try {
    const sensor = await SensorModel.findByPk(sensorId);
    if (!sensor) {
      res.status(404).json({ success: false, message: 'Sensor not found' });
      return;
    }

    sensor.sensorType = sensorType;
    sensor.machineId = machineId;

    await sensor.save();
    res.status(200).json({ success: true, data: sensor });
  } catch (error) {
    handleServerError(res, 'Error updating sensor', error);
  }
};

// Deletar um sensor
export const deleteSensor = async (req: Request, res: Response): Promise<void> => {
  const { sensorId } = req.params;

  try {
    const sensor = await SensorModel.findByPk(sensorId);
    if (!sensor) {
      res.status(404).json({ success: false, message: 'Sensor not found' });
      return;
    }

    await sensor.destroy();
    res.status(200).json({ success: true, message: 'Sensor deleted successfully' });
  } catch (error) {
    handleServerError(res, 'Error deleting sensor', error);
  }
};
