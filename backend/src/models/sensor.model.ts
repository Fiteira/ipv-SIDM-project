import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize"; 
import { Sensor } from "../interfaces/sensor.interface";
import { MachineModel } from "./machine.model";
import { DataModel } from "./data.model";

// Define the Sensor model
export const SensorModel = sequelize.define<Sensor>('Sensor', {
  sensorId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sensorType: {
    type: DataTypes.STRING,
    allowNull: false
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
  apiKey: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  timestamps: false,
  freezeTableName: true, // Prevents table name pluralization
});


SensorModel.hasMany(DataModel, { foreignKey: 'sensorId', as: 'data' });
DataModel.belongsTo(SensorModel, { foreignKey: 'sensorId', as: 'sensor' });