import { Request, Response, NextFunction } from 'express';
import { handleServerError , nestRawResults } from '../utils/helpers';
import { findUserByUserNumber } from '../services/user.service';
import bcrypt from 'bcryptjs';
import { User, UserDTO } from '../interfaces/user.interface';
import { SensorModel } from '../models/sensor.model';
import { MachineModel } from '../models/machine.model';
import { FactoryModel } from '../models/factory.model';
import jwt from 'jsonwebtoken';
import cacheNode from '../config/cache';
import dotenv from "dotenv";

dotenv.config();

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userNumber, password } = req.body;

  if (!userNumber || !password) {
    res.status(400).json({
      success: false,
      message: `${!userNumber ? 'User Number' : 'Password'} is empty.`,
    });
    return;
  }

  try {
    const user: User | null = await findUserByUserNumber(userNumber);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      res.status(401).json({
        success: false,
        message: "User number or password is incorrect.",
      });
      return;
    }

      const userDTO: UserDTO = { userId: user.userId, userNumber: user.userNumber, name: user.name, role: user.role, factoryId: user.factoryId };
      const token = jwt.sign( userDTO , process.env.JWT_SECRET_KEY as string, { expiresIn: '30d' });
      console.log("Token generate: ", token);
      cacheNode.set(`user_${token}`, userDTO);

      res.status(200).json({
        success: true,
        token: token,
      });

  } catch (error) {
    handleServerError(res, "Authentication error", error);
  }
};

export const sensorLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      console.log("The sensor did not send the apiKey");
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
      console.log("Invalid credentials: Sensor not found!");
      return res.status(401).json({ message: 'Invalid credentials!' });
    }

    console.log("Sensor found: ", JSON.stringify(sensor));

    const sensorData = nestRawResults(sensor);
    console.log("Sensor data: ", sensorData);

    const token = jwt.sign({ sensor: sensorData }, process.env.JWT_SECRET_KEY as string, { expiresIn: '1h' });

    cacheNode.set(`sensor_${token}`, sensorData);
    return res.status(200).json({ token });
    
  } catch (error) {
    console.log("Error authenticating sensor: ", error);
    handleServerError(res, "Error authenticating sensor", error);
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
    const user = await findUserByUserNumber(userNumber);
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

  