import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { DataModel } from '../models/data.model'; // Importe o modelo de dados do sensor
import { Data } from '../interfaces/data.interface'; // Importe a interface de dados do sensor
import cacheNode from './cache'; // Importe a cache usada para armazenar o sensor
import { cache } from 'joi';
var moment = require('moment');

interface CachedSensorData {
  sensorId: number;
  value: any;
  timestamp: Date;
}

// Função que configura os eventos de WebSocket
export const configureSocketEvents = (io: SocketIOServer) => {
  // Middleware para validar o token JWT e verificar o sensor na cache antes de permitir a conexão
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;

    // Se o token não foi fornecido, rejeitar a conexão
    if (!token) {
      console.error('Erro de autenticação. Token necessário.');
      return next(new Error('Authentication error. Token required.'));
    }

    // Recuperar o sensor da cache com base no token
    const sensor = cacheNode.get(token);
    const user = cacheNode.get(token);
    if (!sensor && !user) {
      console.error('Sensor ou user não encontrado na cache para o token:', token);
      return next(new Error('Invalid or expired token. Connection rejected.'));
    }
    // Verificar o token JWT manualmente
    jwt.verify(token, "mudar", (err: VerifyErrors | null) => { //////////////Corrigir a parte dos erros////////////////////////////
      if (err) {
        console.error('Erro ao verificar o token:', err);
        return next(new Error('Invalid or expired token. Connection rejected.'));
      }
      // Se o token for válido, associar o sensor ao socket
      socket.data.sensor = sensor;
      next(); // Continuar a conexão
    });
    console.log('Sensor connected');
  });

  // Gerenciar os eventos depois que a conexão foi autenticada
  io.on('connection', (socket: Socket) => {
    if (socket.data.sensor) {
      console.log(`Sensor autenticado: ${socket.data.sensor.name} com id ${socket.data.sensor.sensorId} conectado!`);
    } else if (socket.data.user) {
      console.log(`Usuário autenticado: ${socket.data.user.username} conectado!`);
    } else {
      console.log('Conexão não autenticada!');
    }
    // Evento para receber dados do sensor
    socket.on('sensor_data', (value: any) => {
      console.log(`Dados recebidos do sensor ${socket.data.sensor.sensorId}:`, value);
      
      try {
        const sensorId = socket.data.sensor.sensorId;

        // Recuperar os dados do cache
        let cachedData: CachedSensorData[] = cacheNode.get(sensorId) || [];

        // Adicionar os novos dados ao cache
        cachedData.push({
          sensorId: sensorId,  // ID do sensor
          value: value,  // Valor recebido do sensor
          timestamp: new Date()  // Salvar o timestamp atual
        });

        // Atualizar o cache
        cacheNode.set(sensorId, cachedData);

        console.log(`Dados temporariamente armazenados na cache para o sensor ${sensorId}`);
      } catch (error) {
        console.error(`Erro ao armazenar os dados na cache para o sensor ${socket.data.sensor.sensorId}:`, error);
      }
    });

    // Evento de desconexão
    socket.on('disconnect', () => {
      console.log(`Sensor com id ${socket.data.sensor.sensorId} e nome ${socket.data.sensor.name} desconectado`);
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