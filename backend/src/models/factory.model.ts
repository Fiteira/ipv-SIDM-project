import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize"; 
import { Factory } from "../interfaces/factory.interface";

// Define the Factory model
export const FactoryModel = sequelize.define<Factory>('Factory', {
  factoryId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  factoryName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true  // Location is optional
  }
}, {
  timestamps: false,
  freezeTableName: true, // Prevents table name pluralization
});