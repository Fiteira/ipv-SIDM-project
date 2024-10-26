import { Model } from "sequelize";
import { Data } from "./data.interface";
import { Machine } from "./machine.interface";

export interface Sensor extends Model {
    sensorId: number; 
    name: string;  
    sensorType: string;  
    machineId: number;  
    data?: Data[];  
    machine?: Machine;  
    apiKey: string; 
  }