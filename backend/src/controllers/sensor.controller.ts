import { Request, Response } from 'express';
import { SensorModel } from '../models/sensor.model';
import { handleServerError } from '../utils/helpers';
import { MachineModel } from '../models/machine.model';

export const getSensor = async (req: Request, res: Response): Promise<void> => {
  const { sensorId } = req.params;
  if (!sensorId) {
    res.status(400).json({ success: false, message: 'SensorId is required' });
    return;
  }
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

export const getAllSensorsByFactoryId = async (req: Request, res: Response): Promise<void> => {
  const { factoryId } = req.params;
  if (!factoryId) {
    res.status(400).json({ success: false, message: 'FactoryId is required' });
    return;
  }
  try {
    const sensors = await SensorModel.findAll({ where: { factoryId },
      include: [{ model: MachineModel, as: 'machines' }]});
    res.status(200).json({ success: true, data: sensors });
  } catch (error) {
    handleServerError(res, 'Error fetching sensors by factoryId', error);
  }
}


export const getSensorsByMachineId = async (req: Request, res: Response): Promise<void> => {
    const { machineId } = req.params;
    if (!machineId) {
      res.status(400).json({ success: false, message: 'MachineId is required' });
      return;
    }
    try {
      const sensors = await SensorModel.findAll({ where: { machineId } });
      res.status(200).json({ success: true, data: sensors });
    } catch (error) {
      handleServerError(res, 'Error fetching sensors by machineId', error);
      console.log(error);
    }
  };

export const createSensor = async (req: Request, res: Response): Promise<void> => {
  const { name, sensorType, machineId } = req.body;
  if (!name || !sensorType || !machineId) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return
  }
  let apiKey: string = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  console.log("API_KEY do sensor: ", apiKey);
  try {
    if (apiKey) {
      const newSensor = await SensorModel.create({ name, sensorType, machineId, apiKey });
      res.status(201).json({ success: true, data: newSensor });
    }
  } catch (error) {
    handleServerError(res, 'Error creating sensor', error);
  }
};

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

export const deleteSensor = async (req: Request, res: Response): Promise<void> => {
  const { sensorId } = req.params;
  if (!sensorId) {
    res.status(400).json({ success: false, message: 'SensorId is required' });
    return;
  }
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
