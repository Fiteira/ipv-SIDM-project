const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
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
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
},{
  timestamps: false,
  freezeTableName: true //this is so that sequelize does not pluralize the table
});


const createDefaultUser = async () => {

  const salt = await bcrypt.genSalt();
  const password: string = await bcrypt.hash("admin", salt);
  

  try {
    await User.bulkCreate([
      {  
      userName: "Administrador", 
      email: "admin@admin.com" , 
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

User.afterSync(() => {
  User.count().then((count: number) => {
    if (count === 0) {
      createDefaultUser();
    }
  });
});

module.exports = User