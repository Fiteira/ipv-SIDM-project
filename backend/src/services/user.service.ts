import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/user.model';
import { SensorModel } from '../models/sensor.model';
import { MachineModel } from '../models/machine.model';
import { FactoryModel } from '../models/factory.model';
import { User } from '../interfaces/user.interface';
import dotenv from "dotenv";

dotenv.config();

export const findUserByUserNumber = async (userNumber: number): Promise<User | null> => {
  return UserModel.findOne({ where: { userNumber }});
};

export const findUserDTOByUserNumber = async (userNumber: number): Promise<User | null> => {
  return UserModel.findOne({ where: { userNumber }, attributes: { exclude: ['password'] } });
};

export const createUserService = async (userData: any): Promise<User> => {
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(process.env.DEFAULT_PASSWORD as string, salt); // Adicionei "await" aqui
  const newUser = { ...userData, password: hashedPassword };
  return UserModel.create(newUser);
};

export const generateToken = (data: any, expiresIn: string | undefined = '30d'): string => {
  return jwt.sign(data, process.env.JWT_SECRET_KEY as string, { expiresIn });
};

export const findSensorByApiKey = async (apiKey: string): Promise<any | null> => {
  return SensorModel.findOne({
    where: { apiKey },
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
};
