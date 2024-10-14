import { Request, Response, NextFunction } from 'express';
import { generateJwtToken, validateRequest, findUserByEmail, handleServerError } from '../utils/helpers';
import bcrypt from 'bcryptjs';
import Joi, { ObjectSchema } from 'joi';
import { User } from '../interfaces/user.interface';
import { UserModel } from '../models/user.model';
import { SensorModel } from '../models/sensor.model';
import { findUserByUserNumber } from '../utils/helpers';
import jwt from 'jsonwebtoken';
import cacheNode from '../config/cache';

// Login controller
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { userNumber, password } = req.body;

  // Validação de campos
  if (!userNumber || !password) {
    res.status(400).json({
      success: false,
      message: `${!userNumber ? 'User Number' : 'Password'} is empty.`,
    });
    return;
  }

  try {
    // Buscar usuário pelo userNumber
    const user: User | null = await findUserByUserNumber(userNumber);
    
    // Verificar se o usuário existe
    if (!user) {
      res.status(401).json({
        success: false,
        message: "User number or password is incorrect.",
      });
      return;
    }

    // Comparar a senha
    if (bcrypt.compareSync(password, user.password)) {
      // Gerar o token JWT
      const token = generateJwtToken(user.userNumber, user.userId);
      res.status(200).json({
        success: true,
        token: `Bearer ${token}`,
      });
      return;
    }

    // Caso a senha esteja incorreta
    res.status(401).json({
      success: false,
      message: "User number or password is incorrect.",
    });
  } catch (error) {
    handleServerError(res, "Authentication error", error);
  }
};

// Register controller
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
    password: Joi.string().min(6).regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/).required().messages({
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
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const newUser = { ...req.body, password: hashedPassword, role_id: 2 };
    const createdUser = await UserModel.create(newUser);
    res.status(201).json({
      success: true,
      message: createdUser,
    });
  } catch (error) {
    handleServerError(res, "Error creating user", error);
  }
};

// Sensor login

// Rota para o sensor obter o token
export const sensorlogin = async (req: Request, res: Response): Promise<any> => {
  const { apiKey } = req.body;
  const sensor = await SensorModel.findOne({ where: { apiKey: apiKey } }) || null;
  if (!apiKey) {
    return res.status(400).json({ message: 'apiKey is mandatory!' });
  }
  
  // Verificar se o sensor está autorizado
  if (apiKey === sensor?.apiKey) {
    // Gerar o token JWT
    const token = jwt.sign({ sensor }, "mudar" as string, { expiresIn: '1h' });
    //Salvar o sensor no cache com o token gerado
    cacheNode.set(token, sensor);
    // Retorna o token gerado para o sensor
    return res.status(200).json({ token });
  } else {
    // Se as credenciais forem inválidas, retorna Unauthorized
    return res.status(401).json({ message: 'Invalid credentials!' });
  }
};

