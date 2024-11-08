import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { handleServerError } from '../utils/helpers';
import { createUserService, findUserByUserNumber, findUserDTOByUserNumber } from '../services/user.service';
import bcrypt from 'bcryptjs';

export const getUser = async (req: Request, res: Response): Promise<void> => {
  const { userNumber } = req.params;
  if (!userNumber) {
    res.status(400).json({ success: false, message: 'UserId is required' });
    return
  }
  try {

    const user = await findUserDTOByUserNumber(Number(userNumber));
    //const user = await UserModel.findByPk(userId, { attributes: { exclude: ['password'] } });

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
    const users = await UserModel.findAll();
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
    if (!users.length) {
      res.status(404).json({ success: false, message: 'No users found for this factory' });
      return;
    }
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
    console.log(newUser);
    
    res.status(201).json({ success: true,  message: "User create successfully" });
  } catch (error) {
    handleServerError(res, 'Error creating user, user already exists', error);
  }
}; 

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { userNumber, name, role, factoryId } = req.body;

  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    user.userNumber = userNumber;
    user.name = name;
    user.role = role;
    user.factoryId = factoryId;

    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleServerError(res, 'Error updating user', error);
  }
};

export const updatePassword = async (req: Request, res: Response): Promise<void> => {

  const { userId } = req.params;
  const { password } = req.body;
  if (!userId) {
    res.status(400).json({ success: false, message: 'UserId is required' });
    return;
  }

  try {
    const user = await UserModel.findByPk(userId);
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
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ success: false, message: 'UserId is required' });
    return;
  }
  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    await user.update({ name: 'deleted', password: 'deleted', factoryId: null });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    handleServerError(res, 'Error deleting user', error);
  }
};
