import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize"; 
import { Alert } from "../interfaces/alert.interface";

// Define the Alert model
export const AlertModel = sequelize.define<Alert>('Alert', {
  alertId: {
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
  alertDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  severity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: false,
  freezeTableName: true, // Prevents table name pluralization
});

