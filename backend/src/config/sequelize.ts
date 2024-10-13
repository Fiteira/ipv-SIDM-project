import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Sequelize with environment variables or default values
const sequelizeInstance = new Sequelize({
  dialect: 'postgres',
  host: process.env.URL_DB || 'localhost', 
  port: Number(process.env.PORT_DB) || 9090,
  username: process.env.USER_DB || 'postgres', 
  password: process.env.PASSWORD_DB || 'password', 
  database: 'postgres', 
});

// Authenticate the database connection
sequelizeInstance.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((error: unknown) => {
    console.error('Unable to connect to the database:', error);
  });

// Uncomment this block if you want to synchronize the models with the database
/*
sequelizeInstance.sync()
  .then(() => {
    console.log('Database & tables created!');
  }).catch((error) => { 
    console.error('Error to create database & tables', error);
  });
*/

export default sequelizeInstance;