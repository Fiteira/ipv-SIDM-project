import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { ObjectSchema, ValidationErrorItem } from 'joi';
import UserModel from '../models/user.model';  // Import the User model
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
