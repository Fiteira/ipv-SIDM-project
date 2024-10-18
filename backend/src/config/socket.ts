import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { DataModel } from '../models/data.model';
import { Data } from '../interfaces/data.interface';
import cacheNode from './cache';
var moment = require('moment');

interface CachedSensorData {
  sensorId: number;
  value: any;
  timestamp: Date;
}

export const configureSocketEvents = (io: SocketIOServer) => {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.error('Erro de autenticação. Token necessário.');
      return next(new Error('Authentication error. Token required.'));
    }
    const sensor = cacheNode.get(`sensor_${token}`);
    const user = cacheNode.get(`user_${token}`);
    if (!sensor && !user) {
      console.error('Sensor ou user não encontrado na cache para o token:', token);
      return next(new Error('Invalid or expired token. Connection rejected.'));
    }
    jwt.verify(token, "mudar", (err: VerifyErrors | null) => { 
      if (err) {
        console.error('Erro ao verificar o token:', err);
        return next(new Error('Invalid or expired token. Connection rejected.'));
      }
     if (sensor) {
        socket.data.sensor = sensor;
        socket.join(`${socket.data.sensor.machine.factoryId}`);
        socket.data.room = `${socket.data.sensor.machine.factoryId}`;
      } else if (user) {
        socket.data.user = user;
        socket.join(`${socket.data.user.factoryId}`);
        socket.data.room = `${socket.data.user.factoryId}`;
      }

      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    if (socket.data.sensor) {
      console.log(`Sensor autenticado: ${socket.data.sensor.name} com id ${socket.data.sensor.sensorId} conectado!`);
    } else if (socket.data.user) {
      console.log(`Usuário autenticado: ${socket.data.user.name} conectado!`);
    } else {
      console.log('Tipo de socket não definido!');
    }

    socket.on('sensor_data', (value: any) => {
      console.log(`Dados recebidos do sensor ${socket.data.sensor.sensorId}:`, value);
      try {
        const sensorId = socket.data.sensor.sensorId;
        const data = {
          sensorId: sensorId,
          value: value,
          timestamp: new Date()
        };
        socket.to(socket.data.room).emit('sensor_data', data);

        let cachedData: CachedSensorData[] = cacheNode.get(sensorId) || [];

        cachedData.push(data);

        cacheNode.set(sensorId, cachedData);

        console.log(`Dados temporariamente armazenados na cache para o sensor ${sensorId}`);
      } catch (error) {
        console.error(`Erro ao armazenar os dados na cache para o sensor ${socket.data.sensor.sensorId}:`, error);
      }
    });

    socket.on('disconnect', () => {
      if (socket.data.sensor) {
        console.log(`O Sensor ${socket.data.sensor.sensorId}, da máquina ${socket.data.sensor.machine.machineName} desconectado.`);
      } else if (socket.data.user) {
        console.log(`Utilizador ${socket.data.user.name} desconectado.`);
      } else {
        console.log('Tipo de socket não definido desconectado!');
      }
      socket.leave(socket.data.room);
      socket.disconnect();
    });
  });
};

// Função para persistir os dados do cache no banco de dados periodicamente
const persistSensorDataFromCache = async () => {
  const allKeys = cacheNode.keys();

  for (const sensorId of allKeys) {
    const cachedData: CachedSensorData[] = cacheNode.get(sensorId) || [];

    if (cachedData.length > 0) {
      try {
        // Salvar os dados no banco de dados em lotes
        await DataModel.bulkCreate(
          cachedData.map((entry) => ({
            sensorId: entry.sensorId,
            value: entry.value,
            timestamp: entry.timestamp,
          }))
        );

        console.log(`Dados do sensor ${sensorId} persistidos no banco de dados com sucesso.`);
        cacheNode.del(sensorId);  // Limpa o cache após persistir os dados
      } catch (error) {
        console.error(`Erro ao salvar os dados do sensor ${sensorId}:`, error);
      }
    }
  }
};

// Intervalo para persistir os dados da cache no banco de dados a cada 10 segundos
setInterval(persistSensorDataFromCache, 10000);  // 10 segundos