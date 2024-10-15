import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize"; 
import { Machine } from "../interfaces/machine.interface";
import { SensorModel } from "./sensor.model";
import { FactoryModel } from "./factory.model";

// Define the Machine model
export const MachineModel = sequelize.define<Machine>('Machine', {
  machineId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  machineName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  factoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,  // Relaciona com a fábrica
    references: {
      model: FactoryModel,  // Nome da tabela Factory
      key: 'factoryId'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  timestamps: false,
  freezeTableName: true, // Prevents table name pluralization
});
SensorModel.belongsTo(MachineModel, { foreignKey: 'machineId', as: 'machine' });
MachineModel.hasMany(SensorModel, { foreignKey: 'sensorId', as: 'sensors' });