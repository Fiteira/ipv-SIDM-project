import { Model } from 'sequelize';
import { User } from './user.interface';  

export interface Maintenance extends Model {
  maintenanceId: number;  // Chave primária da manutenção
  machineId: number;  // Chave estrangeira referenciando a máquina
  maintenanceDate: Date;  // Data da manutenção
  description: string;  // Descrição da manutenção
  performedBy: number;  // Chave estrangeira referenciando o usuário que realizou a manutenção (userId)
  performedUser?: User;  // Relacionamento opcional com o modelo de usuário
  alertId: number;  // Chave estrangeira referenciando o alerta
}
