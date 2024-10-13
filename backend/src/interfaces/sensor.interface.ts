import { Model } from "sequelize";
import { Data } from "./data.interface";
import { Machine } from "./machine.interface";

export interface Sensor extends Model {
    sensorId: number;  // Chave primária do sensor
    sensorType: string;  // Tipo de sensor (temperatura, vibração, etc.)
    machineId: number;  // Chave estrangeira referenciando a máquina
    data?: Data[];  // Dados coletados pelo sensor
    machine?: Machine;  // Relacionamento inverso (1:N) para acessar a máquina do sensor
  }