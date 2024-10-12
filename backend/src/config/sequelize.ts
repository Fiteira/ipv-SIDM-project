const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelizeInstance = new Sequelize({
    dialect: 'postgres',
    host: process.env.URL_DB || 'localhost', 
    port: process.env.PORT_DB || 5432,
    username: process.env.USER_DB || 'postgres', 
    password: process.env.PASSWORD_DB || 'admin', 
    database: 'postgres', 
  });

sequelizeInstance.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch((error: unknown) => {
        console.error('Unable to connect to the database:', error);
    });
 

/*
sequelize.sync()
    .then(() => {
        console.log('Database & tables created!');
    }).catch((error) => { 
        console.error('Error to create database & tables', error);
    });
*/

module.exports = sequelizeInstance;