import { Model } from 'sequelize';
import { User } from './user.interface';  

export interface Maintenance extends Model {
  maintenanceId: number; 
  machineId: number;  
  maintenanceDate: Date;  
  description: string;  
  performedBy: number;  
  performedUser?: User;  
  alertId: number;  
}
