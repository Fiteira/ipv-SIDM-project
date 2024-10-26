import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize'; 
import { Maintenance } from '../interfaces/maintenance.interface';
import { UserModel } from './user.model'; 
import { AlertModel } from './alert.model';
import { MachineModel } from './machine.model';

// Define o model Maintenance
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
      model: MachineModel,  
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
      model: AlertModel, 
      key: 'alertId'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  performedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: UserModel, 
      key: 'userId'
    },
    onDelete: 'SET NULL', 
    onUpdate: 'CASCADE'
  }
}, {
  timestamps: false,
  freezeTableName: true  
});


MaintenanceModel.belongsTo(UserModel, {
  foreignKey: 'performedBy',
  as: 'performedUser'  
});

MaintenanceModel.belongsTo(AlertModel, {
  foreignKey: 'alertId',
  as: 'alert'
});

MaintenanceModel.belongsTo(MachineModel, { 
  foreignKey: 'machineId',
   as: 'machine' 
});