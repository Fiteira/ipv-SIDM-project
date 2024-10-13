import { DataTypes, Model } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../config/sequelize"; 
import { User } from "../interfaces/user.interface";

// Define the User model
const UserModel = sequelize.define<User>('User', {
  userId: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false,
  freezeTableName: true, // Prevents table name pluralization
});

// Function to create the default user
const createDefaultUser = async () => {
  const salt = await bcrypt.genSalt();
  const password: string = await bcrypt.hash("admin", salt);

  try {
    await UserModel.bulkCreate([
      {  
        userName: "Administrator", 
        email: "admin@admin.com", 
        password: password, 
        status: 1, 
        roleId: 1 
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

export default UserModel;
