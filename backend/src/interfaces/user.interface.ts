import { Model } from "sequelize";
import { Factory } from "./factory.interface";

export interface User extends Model {
  userId: number;  
  userNumber: string;  
  name: string; 
  password: string;
  role: string; 
  factoryId: number; 
  factory?: Factory;  
}

export interface UserDTO {
  userId: number;
  userNumber: string;
  name: string;
  role: string;
  factoryId: number;
  factory?: Factory;
}