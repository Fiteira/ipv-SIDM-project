import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize"; 
import { Sensor } from "../interfaces/sensor.interface";

// Define the Sensor model
export const SensorModel = sequelize.define<Sensor>('Sensor', {
  sensorId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  sensorType: {
    type: DataTypes.STRING,
    allowNull: false
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
  }
}, {
  timestamps: false,
  freezeTableName: true, // Prevents table name pluralization
});
