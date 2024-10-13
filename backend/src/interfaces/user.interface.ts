import { Model } from "sequelize";

export interface User extends Model {
    userId: number;
    userName: string;
    email: string;
    password: string;
    status: number;
    roleId: number;
  }