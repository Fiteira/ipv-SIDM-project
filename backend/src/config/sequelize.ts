import { Sequelize } from 'sequelize';
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Initialize Sequelize with environment variables or default values
const sequelizeInstance = new Sequelize({
  dialect: 'postgres',
  host: String(process.env.URL_DB),
  port: Number(process.env.PORT_DB),
  username: String(process.env.USER_DB),
  password: String(process.env.PASSWORD_DB),
  database:  isProduction ? 'bd_sidm' : '',
  dialectOptions: {
    ssl:  isProduction
    ? { require: true, rejectUnauthorized: false }
    : false,
  },
});

// Authenticate the database connection
sequelizeInstance.authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');
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