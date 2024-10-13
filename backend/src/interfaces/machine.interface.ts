import { Model } from "sequelize";
import  { Sensor }  from './sensor.interface';
import  { Factory }  from './factory.interface';
import  { Maintenance } from './maintenance.interface';

export interface Machine extends Model {
    machineId: number;  // Chave primária da máquina
    machineName: string;  // Nome da máquina
    factoryId: number;  // Chave estrangeira referenciando a fábrica
    sensors?: Sensor[];  // Sensores associados à máquina
    factory?: Factory;  // Relacionamento inverso (1:N) para acessar a fábrica da máquina
    maintenanceRecords?: Maintenance[];  // Registros de manutenção associados à máquina
  }
