import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize"; 
import { Factory } from "../interfaces/factory.interface";
import { MachineModel } from "./machine.model";
import { UserModel } from "./user.model";

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

FactoryModel.hasMany(MachineModel, { foreignKey: 'machineId', as: 'machines' });

MachineModel.belongsTo(FactoryModel, { foreignKey: 'factoryId', as: 'factory' });