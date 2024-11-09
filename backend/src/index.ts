import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import passport from './config/passport'; 
import cors from 'cors';
import bodyParser from 'body-parser';
import authRoutes from './routes/auth.routes'; 
import userRoutes from './routes/user.routes';
import factoryRoutes from './routes/factory.routes';
import machineRoutes from './routes/machine.routes';
import sensorRoutes from './routes/sensor.routes';
import dataRoutes from './routes/data.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import alertRoutes from './routes/alert.routes';
import { createServer, Server as HTTPServer } from 'http'; 
import { Server as SocketIOServer } from 'socket.io';
import { configureSocketEvents } from './config/socket'; 
//import tensor from "./config/tensor";

dotenv.config();

// Create the Express app
const app: Express = express();
const PORT = process.env.PORT ?? 3000;

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());

// Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);

  if (req.body && Object.keys(req.body).length > 0 && req.url !== '/api/auth/login' && req.url !== '/api/auth/loginsensor') {
    console.log('Body:', req.body);
  } else {
    console.log('Body: No data');
  }

  next();
});

// Defines API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/factories', factoryRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/maintenances', maintenanceRoutes);
app.use('/api/alerts', alertRoutes);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Hello World!" });
});


const httpServer: HTTPServer = createServer(app);

// Creating the WebSocket Server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", 
  },
});


configureSocketEvents(io);

// Start the server
httpServer.listen(PORT, () => {
  console.log(`API listing on PORT: ${PORT}`);
});

/*
tensor({
  columns: ['Air temperature [K]','Process temperature [K]','Rotational speed [rpm]','Torque [Nm]','Tool wear [min]'],
  values: [
    [298, 308, 1455, 41, 202], // Failure
    [298, 308, 1379, 46, 204], // No Failure
    [298, 308, 1727, 27, 37],  // No Failure
    [298, 308, 1412, 52, 218], // Failure
    [298, 308, 1924, 20, 29]   // No Failure
  ]
}).catch(console.error);
*/
export default app;