import { Model } from "sequelize";
import { User } from "./user.interface";
import  { Machine }  from "./machine.interface";

export interface Factory extends Model {
    factoryId: number;  // Chave primária da fábrica
    factoryName: string;  // Nome da fábrica
    location: string;  // Localização da fábrica
    users?: User[];  // Lista de usuários associados à fábrica (relacionamento 1:N)
    machines?: Machine[];  // Máquinas associadas à fábrica
  }
