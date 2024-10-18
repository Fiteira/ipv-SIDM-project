import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize"; 
import { Data } from "../interfaces/data.interface";
import { SensorModel } from "./sensor.model";


export const DataModel = sequelize.define<Data>('Data', {
  dataId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  sensorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: SensorModel, 
      key: 'sensorId'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  value: {
    type: DataTypes.JSONB,
    allowNull: false
  }
}, {
  timestamps: false,
  freezeTableName: true, 
});

