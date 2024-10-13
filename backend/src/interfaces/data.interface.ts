import { Model } from "sequelize";
import { Sensor } from "./sensor.interface";

export interface Data extends Model {
    dataId: number;  // Chave primária dos dados
    sensorId: number;  // Chave estrangeira referenciando o sensor
    timestamp: Date;  // Momento em que o dado foi coletado
    value: number;  // Valor da leitura do sensor
    sensor?: Sensor;  // Relacionamento inverso (1:N) para acessar o sensor
  }