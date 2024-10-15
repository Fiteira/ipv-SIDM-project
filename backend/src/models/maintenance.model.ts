import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize'; 
import { Maintenance } from '../interfaces/maintenance.interface';
import { UserModel } from './user.model';  // Importando o modelo de usuário para criar a associação
import { AlertModel } from './alert.model';
import { MachineModel } from './machine.model';

// Define o modelo Maintenance
export const MaintenanceModel = sequelize.define<Maintenance>('Maintenance', {
  maintenanceId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  machineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: MachineModel,  // Nome da tabela Machine
      key: 'machineId'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  maintenanceDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alertId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: AlertModel,  // Relaciona com o modelo de alerta
      key: 'alertId'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  performedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: UserModel,  // Relaciona com o modelo de usuário
      key: 'userId'
    },
    onDelete: 'SET NULL',  // Se o usuário for deletado, mantém o registro de manutenção, mas sem um usuário
    onUpdate: 'CASCADE'
  }
}, {
  timestamps: false,
  freezeTableName: true  // Evita a pluralização automática do nome da tabela
});

// Definir a associação entre Maintenance e User
MaintenanceModel.belongsTo(UserModel, {
  foreignKey: 'performedBy',
  as: 'performedUser'  // Alias para o relacionamento
});

MaintenanceModel.belongsTo(AlertModel, {
  foreignKey: 'alertId',
  as: 'alert'
});

MaintenanceModel.belongsTo(MachineModel, { 
  foreignKey: 'machineId',
   as: 'machine' 
});