import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectSchema, ValidationErrorItem } from 'joi';
import { UserModel } from '../models/user.model';  
import { User } from '../interfaces/user.interface';  


export const generateJwtToken = (email: string, id: number): string => {
  const payload = { email, id };
  return jwt.sign(payload, "change_this", { expiresIn: "1d" });  
};

export const validateRequest = (schema: ObjectSchema, body: any): string[] | null => {
  const { error } = schema.validate(body, { abortEarly: false });
  if (error) {
    return error.details.map((detail: ValidationErrorItem) => detail.message);
  }
  return null;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const user = await UserModel.findOne({ where: { email } });
    return user; 
  } catch (error) {
    throw new Error("Error verifying user email: " + error);
  }
};

export const findUserByUserNumber = async (userNumber: string): Promise<User | null> => {
  try {
    const user: User = nestRawResults(await UserModel.findOne({ where: { userNumber }, raw: true }));
    return user; 
  } catch (error) {
    throw new Error("Error verifying user number: " + error);
  }
};

export const handleServerError = (res: Response, message: string, error: any): Response => {
  return res.status(500).json({
    success: false,
    message: `${message}: ${error}`
  });
};

export function nestRawResults(data: any) {
  if (typeof data !== 'object' || data === null) {
    console.log('Data is not an object or is null and cannot be nested!');
    return data;
  }

  const result: any = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const keys = key.split(/[.[\]]+/).filter(Boolean); 

      keys.reduce((accumulator, currentKey, index) => {
        const isArrayIndex = !isNaN(Number(currentKey)); 

        if (index === keys.length - 1) {
          accumulator[currentKey] = data[key];
        } else if (isArrayIndex) {
          if (!Array.isArray(accumulator[currentKey])) {
            accumulator[currentKey] = [];
          }
          if (!accumulator[currentKey][Number(currentKey)]) {
            accumulator[currentKey][Number(currentKey)] = {};
          }
          accumulator = accumulator[currentKey][Number(currentKey)];
        } else {
          if (!accumulator[currentKey]) {
            accumulator[currentKey] = {};
          }
          accumulator = accumulator[currentKey];
        }
        return accumulator;
      }, result);
    }
  }

  return result;
}

