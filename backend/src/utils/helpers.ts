import { Response } from 'express';
import jwt from 'jsonwebtoken';
import Joi,{ ObjectSchema, ValidationErrorItem } from 'joi';


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

export const userRegistrationSchema = (): ObjectSchema => {
  return Joi.object({
    name: Joi.string().min(3).required().messages({
      'string.base': 'Name must be a valid string',
      'string.empty': 'Name cannot be empty',
      'string.min': 'Name must have at least {#limit} characters',
    }),
    password: Joi.string().min(6).regex(/^(?=.*[a-zA-Z])(?=.*\d)/).required().messages({
      'string.base': 'Password must be a valid string',
      'string.empty': 'Password cannot be empty',
      'string.min': 'Password must have at least {#limit} characters',
      'string.pattern.base': 'Password must contain at least one letter and one number',
    })
  });
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


