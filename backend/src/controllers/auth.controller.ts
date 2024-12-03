import { Request, Response, NextFunction } from 'express';
import { handleServerError, nestRawResults } from '../utils/helpers';
import { findUserByUserNumber } from '../services/user.service';
import bcrypt from 'bcryptjs';
import { User, UserDTO } from '../interfaces/user.interface';
import { SensorModel } from '../models/sensor.model';
import { MachineModel } from '../models/machine.model';
import { FactoryModel } from '../models/factory.model';
import { UserModel } from '../models/user.model';
import jwt from 'jsonwebtoken';
import cacheNode from '../config/cache';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to generate token and cache data
function generateTokenAndCache(
  type: 'user' | 'sensor',
  id: number,
  data: any,
  expiresIn: string
): string {
  const tokenPayload = { [`${type}Id`]: id };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET_KEY as string, { expiresIn });
  cacheNode.set(`${type}_${id}`, data);
  return token;
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userNumber, password, deviceToken } = req.body;

  if (!userNumber || !password) {
    res.status(400).json({
      success: false,
      message: `${!userNumber ? 'User Number' : 'Password'} is empty.`,
    });
    return;
  }

  try {
    const user: User | null = await findUserByUserNumber(userNumber);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({
        success: false,
        message: 'User number or password is incorrect.',
      });
      return;
    }

    const userDTO: UserDTO = {
      userId: user.userId,
      userNumber: user.userNumber,
      name: user.name,
      role: user.role,
      factoryId: user.factoryId,
      ...(deviceToken && { deviceToken }),
    };

    const token = generateTokenAndCache('user', user.userId, userDTO, '30d');

    res.status(200).json({
      success: true,
      token: token,
      user: userDTO,
    });
  } catch (error) {
    console.error('Authentication error:', error);
    handleServerError(res, 'Authentication error', error);
  }
};

export const sensorLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      console.error('The sensor did not send the apiKey');
      return res.status(400).json({ message: 'apiKey is mandatory!' });
    }

    const sensor = await SensorModel.findOne({
      where: { apiKey: apiKey },
      include: [
        {
          model: MachineModel,
          as: 'machine',
          attributes: ['machineId', 'machineName', 'factoryId'],
          include: [
            {
              model: FactoryModel,
              as: 'factory',
              attributes: ['factoryId', 'factoryName', 'location'],
            },
          ],
        },
      ],
      raw: true,
    });

    if (!sensor) {
      console.error('Invalid credentials: Sensor not found!');
      return res.status(401).json({ message: 'Invalid credentials!' });
    }

    const sensorData = nestRawResults(sensor);

    const token = generateTokenAndCache('sensor', sensorData.sensorId, sensorData, '1h');

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error authenticating sensor:', error);
    handleServerError(res, 'Error authenticating sensor', error);
  }
};


export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  const { userNumber } = req.body;
  const password = process.env.DEFAULT_PASSWORD as string;

  if (!userNumber) {
    res.status(400).json({ success: false, message: 'UserNumber is required' });
    return;
  }

  try {
    const user = await findUserByUserNumber(Number(userNumber));
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    await UserModel.update({ password: hashedPassword }, { where: { userNumber } });

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    handleServerError(res, 'Error resetting password', error);
  }
}

export const changeUserPassword = async (req: Request, res: Response): Promise<void> => {
  const { userNumber } = req.params;
  const { password } = req.body;
  if (!userNumber) {
    res.status(400).json({ success: false, message: 'UserNumber is required' });
    return;
  } else if (!password) {
    res.status(400).json({ success: false, message: 'Password is required' });
    return;
  }

  try {
    const user = await findUserByUserNumber(Number(userNumber));
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    await UserModel.update({ password: hashedPassword }, { where: { userNumber } });

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    handleServerError(res, 'Error resetting password', error);
  }
}

  