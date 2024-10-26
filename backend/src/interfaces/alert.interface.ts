import { Model } from "sequelize";
import { Machine } from "./machine.interface";

export interface Alert extends Model {
    alertId: number;  
    machineId: number;  
    alertDate: Date;  
    severity: string;  
    message: string;  
    machine: Machine; 
    state: string; 
}