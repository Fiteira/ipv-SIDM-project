import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectSchema, ValidationErrorItem } from 'joi';
import { UserModel } from '../models/user.model';  // Import the User model
import { User } from '../interfaces/user.interface';  // Import the User interface

/**
 * Generates a JWT token with the provided payload
 * @param email - The user's email
 * @param id - The user's ID
 * @returns A JWT token string
 */
export const generateJwtToken = (email: string, id: number): string => {
  const payload = { email, id };
  return jwt.sign(payload, "change_this", { expiresIn: "1d" });  // Replace "change_this" with a proper secret key in production
};

/**
 * Validates a request body against a Joi schema
 * @param schema - The Joi schema to validate against
 * @param body - The request body to validate
 * @returns An array of error messages, or null if validation passes
 */
export const validateRequest = (schema: ObjectSchema, body: any): string[] | null => {
  const { error } = schema.validate(body, { abortEarly: false });
  if (error) {
    return error.details.map((detail: ValidationErrorItem) => detail.message);
  }
  return null;
};

/**
 * Finds a user by email
 * @param email - The user's email to search for
 * @returns The user if found, or null if not found
 * @throws An error if the database operation fails
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const user = await UserModel.findOne({ where: { email } });
    return user;  // Can return a User instance or null
  } catch (error) {
    throw new Error("Error verifying user email: " + error);
  }
};

/**
 * Finds a user by user number
 * @param userNumber - The user's user number to search for
 * @returns The user if found, or null if not found
 * @throws An error if the database operation fails
 */
export const findUserByUserNumber = async (userNumber: string): Promise<User | null> => {
  try {
    const user = await UserModel.findOne({ where: { userNumber } });
    return user;  // Can return a User instance or null
  } catch (error) {
    throw new Error("Error verifying user number: " + error);
  }
};

/**
 * Handles server errors by sending a standardized response
 * @param res - The Express response object
 * @param message - A message describing the error
 * @param error - The error object
 * @returns The response with the error message
 */
export const handleServerError = (res: Response, message: string, error: any): Response => {
  return res.status(500).json({
    success: false,
    message: `${message}: ${error}`
  });
};

/**
 * Nest raw results from a SQL query into a structured object
 * @param data - The raw data from the SQL query
 * @returns A structured object with nested fields
 * @throws An error if the input data is not an object
 */
export function nestRawResults(data: any) {
  if (typeof data !== 'object' || data === null) {
    console.log('Data is not an object or is null and cannot be nested!');
    return data;
  }

  const result: any = {};

  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      // Split the key into parts (supporting array notation, e.g., "items[0].name")
      const keys = key.split(/[\.\[\]]+/).filter(Boolean); // Divide a chave em partes e remove vazios

      // Traverse the key parts and create nested objects/arrays
      keys.reduce((accumulator, currentKey, index) => {
        const isArrayIndex = !isNaN(Number(currentKey)); // Verifica se é um índice de array

        // Se for o último item, atribua o valor
        if (index === keys.length - 1) {
          accumulator[currentKey] = data[key];
        } else {
          // Se for um índice de array, inicialize como array
          if (isArrayIndex) {
            if (!Array.isArray(accumulator)) {
              accumulator = [];
            }
            if (!accumulator[currentKey]) {
              accumulator[currentKey] = {};
            }
          } else {
            // Se for um objeto, inicialize como objeto
            if (!accumulator[currentKey]) {
              accumulator[currentKey] = {};
            }
          }
        }

        return accumulator[currentKey];
      }, result);
    }
  }

  return result;
}

