import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import passport from './config/passport'; 
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.routes';  
//import userRoutes from './routes/user.routes';  

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());  

// Logger middleware to print request info
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Define the routes for the API
app.use('/api/auth', authRoutes);  
//app.use('/api/users', userRoutes); 

// Example route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Hello World!" });
});

// Server start
app.listen(PORT, () => {
  console.log(`API listening on port: ${PORT}`);
});

export default app;
