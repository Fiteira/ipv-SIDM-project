import { Request, Response, NextFunction } from 'express';
import { validateRequest, findUserByEmail, handleServerError , nestRawResults , findUserByUserNumber } from '../utils/helpers';
import bcrypt from 'bcryptjs';
import Joi, { ObjectSchema } from 'joi';
import { User, UserDTO } from '../interfaces/user.interface';
import { UserModel } from '../models/user.model';
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
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User number or password is incorrect.",
      });
      return;
    }


    if (bcrypt.compareSync(password, user.password)) {

      const userDTO: UserDTO = { userId: user.userId, userNumber: user.userNumber, name: user.name, role: user.role, factoryId: user.factoryId };
      const token = jwt.sign( userDTO , process.env.JWT_SECRET_KEY as string, { expiresIn: '30d' });
      console.log("Token generate: ", token);
      cacheNode.set(`user_${token}`, userDTO);

      res.status(200).json({
        success: true,
        token: token,
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: "User number or password is incorrect.",
    });

  } catch (error) {
    handleServerError(res, "Authentication error", error);
  }
};


export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const schema: ObjectSchema = Joi.object({
    name: Joi.string().min(3).required().messages({
      'string.base': 'Name must be a valid string',
      'string.empty': 'Name cannot be empty',
      'string.min': 'Name must have at least {#limit} characters',
    }),
    email: Joi.string().email().required().messages({
      'string.base': 'Email must be a valid string',
      'string.empty': 'Email cannot be empty',
      'string.email': 'Email must be a valid email address',
    }),
    password: Joi.string().min(6).regex(/^(?=.*[a-zA-Z])(?=.*\d)/).required().messages({
      'string.base': 'Password must be a valid string',
      'string.empty': 'Password cannot be empty',
      'string.min': 'Password must have at least {#limit} characters',
      'string.pattern.base': 'Password must contain at least one letter and one number',
    }),
  });

  const validationErrors = validateRequest(schema, req.body);
  if (validationErrors) {
    res.status(400).json({
      success: false,
      message: validationErrors[0],
    });
    return;
  }

  try {
    const userExists = await findUserByEmail(req.body.email);
    if (userExists) {
      res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
      return;
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash("123456", salt);
    const newUser = { ...req.body, password: hashedPassword };
    const createdUser = await UserModel.create(newUser);
    res.status(201).json({
      success: true,
      message: createdUser,
    });
  } catch (error) {
    handleServerError(res, "Error creating user", error);
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

  