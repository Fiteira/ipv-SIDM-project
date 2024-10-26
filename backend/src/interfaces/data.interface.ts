import { Model } from "sequelize";
import { Sensor } from "./sensor.interface";

export interface Data extends Model {
    dataId: number;  
    sensorId: number; 
    timestamp: Date;  
    value: any; 
    sensor?: Sensor;  
  }