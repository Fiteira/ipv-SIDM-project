import { Model } from "sequelize";
import  { Sensor }  from './sensor.interface';
import  { Factory }  from './factory.interface';
import  { Maintenance } from './maintenance.interface';

export interface Machine extends Model {

    machineId: number; 
    machineName: string;  
    factoryId: number;  
    sensors?: Sensor[];
    factory?: Factory;
    maintenanceRecords?: Maintenance[]; 
    state: string; 

  }
