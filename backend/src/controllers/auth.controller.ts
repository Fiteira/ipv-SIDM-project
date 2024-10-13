import { Request, Response, NextFunction } from 'express';
import { generateJwtToken, validateRequest, findUserByEmail, handleServerError } from '../utils/helpers';
import bcrypt from 'bcryptjs';
import Joi, { ObjectSchema } from 'joi';
import { User } from '../interfaces/user.interface';
import UserModel from '../models/user.model';

// Login controller
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: `${!email ? 'Email' : 'Password'} is empty.`,
    });
    return;
  }

  try {
    const user: User | null = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Email or password is incorrect.",
      });
      return;
    }

    if (user.status === 0) {
      res.status(401).json({
        success: false,
        message: "The account is deactivated. Please check your email or contact administration.",
      });
      return;
    }

    if (bcrypt.compareSync(password, user.password)) {
      const token = generateJwtToken(user.email, user.userId);
      res.status(200).json({
        success: true,
        token: `Bearer ${token}`,
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: "Email or password is incorrect.",
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
