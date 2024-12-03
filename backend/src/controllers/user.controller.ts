import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { handleServerError } from '../utils/helpers';
import { createUserService, findUserByUserNumber, findUserDTOByUserNumber } from '../services/user.service';
import bcrypt from 'bcryptjs';
import { findSourceMap } from 'module';

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const { userNumber } = req.params;
  if (!userNumber) {
    res.status(400).json({ success: false, message: 'UserId is required' });
    return
  }
  try {

    const user = await findUserDTOByUserNumber(Number(userNumber));

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleServerError(res, 'Error fetching user', error);
  }
};


export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await UserModel.findAll({ attributes: { exclude: ['password'] } });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    handleServerError(res, 'Error fetching users', error);
  }
};

export const getUsersByFactoryId = async (req: Request, res: Response): Promise<void> => {
  const { factoryId } = req.params;
  if (!factoryId) {
    res.status(400).json({ success: false, message: 'FactoryId is required' });
    return;
  }

  try {
    const users = await UserModel.findAll({ where: { factoryId }, attributes: { exclude: ['password'] } });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    handleServerError(res, 'Error fetching users by factoryId', error);
  }
};


export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { name, role, factoryId } = req.body;
  if (!name || !role || !factoryId) {
    res.status(400).json({ success: false, message: 'Name, role, factoryId are required' });
    return;
  }
  try {

    const newUser = await createUserService(req.body);
    
    res.status(201).json({ success: true,  message: "User create successfully" });
  } catch (error) {
    handleServerError(res, 'Error creating user, user already exists', error);
  }
}; 

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { userNumber } = req.params; //É o userNumber
  const { name, role, factoryId } = req.body;

  if (!userNumber) {
    res.status(400).json({ success: false, message: 'UserNumber is required' });
    return;
  }

  try {
    const user = await findUserDTOByUserNumber(Number(userNumber))
    if (!user) {
      console.error("User not found")
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (name)user.name = name;
    else if (role) user.role = role;
    else if (factoryId) user.factoryId = factoryId;

    await UserModel.update({ name: user.name }, { where: { userNumber } });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleServerError(res, 'Error updating user', error);
  }
};

export const updatePassword = async (req: Request, res: Response): Promise<void> => {

  const { userNumber } = req.params;
  const { password } = req.body;
  if (!userNumber) {
    res.status(400).json({ success: false, message: 'UserNumber is required' });
    return;
  }

  try {
    const user = await findUserDTOByUserNumber(Number(userNumber))
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;

    await user.save();
    res.status(200).json({ success: true, message: "Password update successfully" });
  } catch (error) {
    handleServerError(res, 'Error updating user password', error);
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { userNumber } = req.params;
  if (!userNumber) {
    res.status(400).json({ success: false, message: 'UserNumber is required' });
    return;
  }
  try {
    const user = await findUserByUserNumber(Number(userNumber))
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    await UserModel.update({ name: 'deleted', password: 'deleted', factoryId: null }, { where: { userNumber } });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    handleServerError(res, 'Error deleting user', error);
  }
};
