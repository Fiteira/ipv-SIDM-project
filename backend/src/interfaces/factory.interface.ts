import { Model } from "sequelize";
import { User } from "./user.interface";
import  { Machine }  from "./machine.interface";

export interface Factory extends Model {
    factoryId: number;  
    factoryName: string;  
    location: string;  
    users?: User[];  
    machines?: Machine[]; 
  }
