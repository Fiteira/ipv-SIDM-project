import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { handleServerError } from '../utils/helpers';

// Obter um usuário pelo ID
export const getUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleServerError(res, 'Error fetching user', error);
  }
};

// Obter todos os usuários por factoryId
export const getUserByFactoryId = async (req: Request, res: Response): Promise<void> => {
  const { factoryId } = req.params;

  try {
    const users = await UserModel.findAll({ where: { factoryId } });
    if (!users.length) {
      res.status(404).json({ success: false, message: 'No users found for this factory' });
      return;
    }
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    handleServerError(res, 'Error fetching users by factoryId', error);
  }
};


// Criar um novo usuário
export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { userNumber, name, role, factoryId, password } = req.body;

  try {
    const newUser = await UserModel.create({ userNumber, name, password, role, factoryId });
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    handleServerError(res, 'Error creating user', error);
  }
}; 

// Atualizar um usuário existente
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

// Deletar um usuário
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    await user.destroy();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    handleServerError(res, 'Error deleting user', error);
  }
};