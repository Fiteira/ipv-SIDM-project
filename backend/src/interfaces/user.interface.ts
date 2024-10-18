import { Model } from "sequelize";
import { Factory } from "./factory.interface";

export interface User extends Model {
  userId: number;  // Chave primária do usuário
  userNumber: string;  // Numero do usuário
  name: string;  // Nome do usuário
  password: string;  // Senha do usuário
  role: string;  // Função do usuário (admin, operador, etc.)
  factoryId: number;  // Chave estrangeira referenciando a fábrica
  factory?: Factory;  // Relacionamento inverso para acessar a fábrica do usuário (1:1)
}

export interface UserDTO {
  userId: number;
  userNumber: string;
  name: string;
  role: string;
  factoryId: number;
  factory?: Factory;
}