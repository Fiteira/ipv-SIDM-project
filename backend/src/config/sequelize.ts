import { Sequelize } from 'sequelize';
import dotenv from "dotenv";

dotenv.config();

const sequelizeInstance = new Sequelize({
  dialect: 'postgres',
  host: process.env.URL_DB, 
  port: process.env.PORT_DB ? parseInt(process.env.PORT_DB, 10) : undefined,
  username: process.env.USER_DB,
  password: process.env.PASSWORD_DB,
  database: process.env.DATABASE_NAME || 'postgres',
  dialectOptions: process.env.NODE_ENV === 'production' ? { ssl: { require: true, rejectUnauthorized: false } } : {}
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

sequelizeInstance.sync()
  .then(() => {
    console.log('Database & tables created!');
  }).catch((error) => { 
    console.error('Error to create database & tables', error);
  });


export default sequelizeInstance;