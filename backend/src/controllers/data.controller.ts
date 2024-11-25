import { Request, Response } from 'express';
import { DataModel } from '../models/data.model';
import { handleServerError } from '../utils/helpers';

export const getData = async (req: Request, res: Response): Promise<void> => {
  const { dataId } = req.params;
  if (!dataId) {
    res.status(400).json({ success: false, message: 'DataId is required' });
    return;
  }

  try {
    const data = await DataModel.findByPk(dataId);
    if (!data) {
      res.status(404).json({ success: false, message: 'Data not found' });
      return;
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleServerError(res, 'Error fetching data', error);
  }
};

export const getDataBySensorId = async (req: Request, res: Response): Promise<void> => {
    const { sensorId } = req.params;
    if (!sensorId) {
      res.status(400).json({ success: false, message: 'SensorId is required' });
      return;
    }

    try {
      const data = await DataModel.findAll({ where: { sensorId } });
      res.status(200).json({ success: true, data });
    } catch (error) {
      handleServerError(res, 'Error fetching data by sensorId', error);
    }
  };

export const createData = async (req: Request, res: Response): Promise<void> => {
  const { sensorId, value } = req.body;
  if (!sensorId || !value) {
    res.status(400).json({ success: false, message: 'SensorId, timestamp, and value are required' });
    return;
  }
  try {
    const newData = await DataModel.create({ sensorId, timestamp: new Date(), value });
    res.status(201).json({ success: true, data: newData });
  } catch (error) {
    handleServerError(res, 'Error creating data', error);
  }
};

export const updateData = async (req: Request, res: Response): Promise<void> => {
  const { dataId } = req.params;
  const { sensorId, value } = req.body;
  if (!dataId) {
    res.status(400).json({ success: false, message: 'DataId is required' });
    return;
  }
  try {
    const data = await DataModel.findByPk(dataId);
    if (!data) {
      res.status(404).json({ success: false, message: 'Data not found' });
      return;
    }

    if (sensorId) data.sensorId = sensorId;
    else if (value) data.value = value;

    await data.save();
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleServerError(res, 'Error updating data', error);
  }
};

export const deleteData = async (req: Request, res: Response): Promise<void> => {
  const { dataId } = req.params;
  if (!dataId) {
    res.status(400).json({ success: false, message: 'DataId is required' });
    return;
  }
  try {
    const data = await DataModel.findByPk(dataId);
    if (!data) {
      res.status(404).json({ success: false, message: 'Data not found' });
      return;
    }

    await data.destroy();
    res.status(200).json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    handleServerError(res, 'Error deleting data', error);
  }
};
