import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/sequelize'; 
import { Maintenance } from '../interfaces/maintenance.interface';
import { UserModel } from './user.model';  // Importando o modelo de usuário para criar a associação

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
      model: 'Machine',  // Nome da tabela Machine
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
