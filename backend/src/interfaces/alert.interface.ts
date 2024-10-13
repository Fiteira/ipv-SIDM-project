import { Model } from "sequelize";
import { Machine } from "./machine.interface";

export interface Alert extends Model {
    alertId: number;  // Chave primária do alerta
    machineId: number;  // Chave estrangeira referenciando a máquina
    alertDate: Date;  // Data do alerta
    severity: string;  // Nível de severidade do alerta (baixa, média, alta)
    message: string;  // Mensagem do alerta
    machine: Machine;  // Relacionamento inverso para acessar a máquina
  }