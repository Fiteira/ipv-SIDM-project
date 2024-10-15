import { DataTypes } from "sequelize";
import sequelize from "../config/sequelize"; 
import { User } from "../interfaces/user.interface";
import { FactoryModel } from "./factory.model";  // Importar o modelo da fábrica para a associação
import bcrypt from 'bcryptjs';  // Importar o módulo bcrypt para criptografar a senha

// Define o modelo User
export const UserModel = sequelize.define<User>('User', {
  userId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  userNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true  // Garantir que o userNumber seja único
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
    allowNull: false,
    references: {
      model: FactoryModel,  // Referência ao modelo Factory
      key: 'factoryId'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  }
}, {
  timestamps: false,
  freezeTableName: true  // Evita a pluralização automática do nome da tabela
});

// Definir a associação entre User e Factory
UserModel.belongsTo(FactoryModel, {
  foreignKey: 'factoryId',
  as: 'factory'  // Alias para o relacionamento inverso
});

FactoryModel.hasMany(UserModel, { foreignKey: 'userId', as: 'users' });


// Function to create the default user
const createDefaultUser = async () => {
  const salt = await bcrypt.genSalt();
  const password: string = await bcrypt.hash("admin", salt);

  try {
    await FactoryModel.bulkCreate([
      { factoryName: "Admin Factory", 
        location: "Admin Location" }
    ]);
    await UserModel.bulkCreate([
      {  
        name: "Administrator", 
        userNumber: 1, 
        password: password,  
        role: "admin",
        factoryId: 1
      }
    ]);
    console.log('User created successfully.');
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

