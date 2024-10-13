import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize"; 
import { Machine } from "../interfaces/machine.interface";

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
      model: 'Factory',  // Nome da tabela Factory
      key: 'factoryId'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  timestamps: false,
  freezeTableName: true, // Prevents table name pluralization
});
