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

dotenv.config();

export const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());

// Middleware de log de solicitações
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);

  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  } else {
    console.log('Body: Nenhum corpo de requisição.');
  }

  next();
});

// Define the routes for the API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/factories', factoryRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/maintenances', maintenanceRoutes);
app.use('/api/alerts', alertRoutes);

// Rota de exemplo
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Hello World!" });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`API ouvindo na porta: ${PORT}`);
});

export default app;