import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize"; 
import { User } from "../interfaces/user.interface";
import { FactoryModel } from "./factory.model"; 
import bcrypt from 'bcryptjs';  
import { MachineModel } from "./machine.model";
import { SensorModel } from "./sensor.model";
import dotenv from "dotenv";
import sequelizeInstance from "../config/sequelize";

dotenv.config();

export const UserModel = sequelize.define<User>('User', {
  userId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  userNumber: {
    type: DataTypes.INTEGER,
    defaultValue: sequelizeInstance.literal("nextval('user_number_seq')"),
    unique: true,
    allowNull: false,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  factoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: FactoryModel,  
      key: 'factoryId'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  timestamps: false,
  freezeTableName: true  
});


UserModel.beforeCreate((user) => {
  if (user.role !== "adminSystem" && user.factoryId === null) {
    throw new Error("User must have a factoryId");
  }
});

UserModel.belongsTo(FactoryModel, {
  foreignKey: 'factoryId',
  as: 'factory'  
});

FactoryModel.hasMany(UserModel, { foreignKey: 'factoryId', as: 'users' });


const createDefaultUser = async () => {
  const salt = await bcrypt.genSalt();
  const password: string = await bcrypt.hash(process.env.PASSWORD_USER as string, salt);

  try {
    await FactoryModel.bulkCreate([
      { factoryName: "Factory XPTO",
        location: "Location Viseu" }
    ]);
    await UserModel.bulkCreate([
      {  
        name: "System Administrator", 
        userNumber: 1, 
        password: password,  
        role: "adminSystem",
        factoryId: null
      },
      {  
        name: "Admin Factory XPTO", 
        userNumber: 2, 
        password: password,  
        role: "admin",
        factoryId: 1
      },
      {  
        name: "User", 
        userNumber: 3, 
        password: password,  
        role: "user",
        factoryId: 1
      }
    ]);
    await MachineModel.bulkCreate([
      { machineName: "Machine 1", factoryId: 1 },
      { machineName: "Machine 2", factoryId: 1 }
    ]);
    const sensor = await SensorModel.bulkCreate([
      { name: "Sensor 1", machineId: 1, apiKey: "123", sensorType: "xpto_32" },
      { name: "Sensor 2", machineId: 2, apiKey: "456", sensorType: "xpto_43" }
    ]);
    console.log('Sensor created: ', sensor);
  } catch (error) {
    console.error('Error to create User', error);
  }
};

// Hook to create the default user if none exists after syncing
UserModel.afterSync(() => {
  UserModel.count().then((count: number) => {
    if (count === 0) {
      createDefaultUser();
    }
  });
});

