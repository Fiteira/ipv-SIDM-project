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
import { createServer, Server as HTTPServer } from 'http'; // Para criar um servidor HTTP
import { Server as SocketIOServer } from 'socket.io';
import { configureSocketEvents } from './config/socket'; // Importando a configuração de eventos WebSocket
import readAndPrintCSV from "./config/csv";
import tensor from "./config/tensor";

dotenv.config();

// Crie o app Express
const app: Express = express();
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

// Define as rotas da API
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

// Criando o servidor HTTP
const httpServer: HTTPServer = createServer(app);

// Criando o servidor WebSocket
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*", // Permitir requisições de qualquer origem
  },
});

// Configurando os eventos do WebSocket em um arquivo separado
configureSocketEvents(io);

// Iniciar o servidor
httpServer.listen(PORT, () => {
  console.log(`API ouvindo na porta: ${PORT}`);
});

// Função assíncrona para ler o csv
/*
const readCSVData = async () => {
  try {
    const data: any = await readAndPrintCSV("./dataset.csv");
    if (data) {
      console.log(data);
    } else {
      console.log("No data found in CSV.");
    }
  } catch (error) {
    console.error("Error reading CSV data:", error);
  }
};

// Chamar a função assíncrona
readCSVData();*/
tensor().catch(console.error);

export default app;