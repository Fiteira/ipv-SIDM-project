import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { DataModel } from '../models/data.model';
import { Data } from '../interfaces/data.interface';
import cacheNode from './cache';
var moment = require('moment');
import tensor from "./tensor";

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
  // Obter todos os objetos do cache em vez de apenas as keys
  const allCachedData = cacheNode.keys().map(sensorId => ({
    sensorId,
    data: cacheNode.get(sensorId) as CachedSensorData[] || [],
  }));

  for (const sensor of allCachedData) {
    const { sensorId, data: cachedData } = sensor;

    if (cachedData.length > 0) {
      try {
        console.log(`Persistindo dados para o sensor ${sensorId} com ${cachedData.length} entradas.`);

        // Salvar os dados no banco de dados em lotes
        await DataModel.bulkCreate(
          cachedData.map((entry) => ({
            sensorId: entry.sensorId,
            value: entry.value,
            timestamp: entry.timestamp,
          }))
        );

        // Normalizar os dados do sensor para o formato esperado pelo modelo de aprendizado de máquina
        const normalizedData = normalizeSensorDataList(
          cachedData.map((entry) => Object.values(entry.value))
        );

        // Detectar anomalias com o modelo de aprendizado de máquina
        console.log("Por favor, aguarde enquanto o modelo de aprendizado de máquina detecta anomalias...");
        const anomalies = await tensor(normalizedData).catch((error) => {
          console.error('Erro ao processar com o modelo de aprendizado de máquina:', error);
          return [];
        });

        if (Array.isArray(anomalies) && anomalies.length > 0) {
          console.log("Anomalias detectadas:", anomalies);

          // Identificar quais sensores enviaram os dados anômalos utilizando a correspondência dos índices
          anomalies.forEach((anomalyData, index) => {
            const correspondingData = cachedData[index];
            if (correspondingData) {
              console.log(`Alerta: Dados anômalos detectados para o sensor ${correspondingData.sensorId}`);
              // Lógica adicional para enviar alertas ou salvar logs
            }
          });
        } else {
          console.log(`Nenhuma anomalia detectada para o sensor ${sensorId}.`);
        }

        console.log(`Dados do sensor ${sensorId} persistidos no banco de dados com sucesso.`);
        cacheNode.del(sensorId);  // Limpa o cache após persistir os dados
      } catch (error) {
        console.error(`Erro ao salvar os dados do sensor ${sensorId}:`, error);
      }
    } else {
      console.log(`Nenhum dado na cache para o sensor ${sensorId}.`);
    }
  }
};

// Normalizar os dados do sensor para o formato esperado pelo modelo de aprendizado de máquina
function normalizeSensorDataList(sensorDataList: any[]): number[][] {
  return sensorDataList.map(sensorData => Object.values(sensorData));
}


// Intervalo para persistir os dados da cache no banco de dados a cada 10 segundos
setInterval(persistSensorDataFromCache, 10000);  // 10 segundos