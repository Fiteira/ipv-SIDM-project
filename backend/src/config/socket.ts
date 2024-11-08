import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import { DataModel } from '../models/data.model';
import { Data } from '../interfaces/data.interface';
import { Alert } from '../interfaces/alert.interface';
import { AlertModel } from '../models/alert.model';
import cacheNode from './cache';
import moment from 'moment';
import tensor from "./tensor";
import { Sensor } from '../interfaces/sensor.interface';
import { COLUMNS_TO_USE } from './tensor';
import { SensorModel } from '../models/sensor.model';
import { sendNotification } from './notifications';
import { UserDTO } from '../interfaces/user.interface';

interface CachedSensorData {
  sensorId: number;
  value: any;
  timestamp: Date;
  machineId: number;
}

interface SensorData {
  columns: string[];
  values: number[][];
}

export const configureSocketEvents = (io: SocketIOServer) => {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.error('Authentication error: Token required.');
      return next(new Error('Authentication error: Token required.'));
    }

    const sensor = cacheNode.get(`sensor_${token}`);
    const user = cacheNode.get(`user_${token}`);
    if (!sensor && !user) {
      console.error('Sensor or user not found in cache for token:', token);
      return next(new Error('Invalid or expired token. Connection rejected.'));
    }

    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      console.error('JWT secret key is missing.');
      return next(new Error('Internal server error: JWT secret key is missing.'));
    }

    jwt.verify(token, secretKey, (err: VerifyErrors | null) => { 
      if (err) {
        console.error('Token verification error:', err);
        return next(new Error('Invalid or expired token. Connection rejected.'));
      }
      if (sensor) {
        socket.data.sensor = sensor;
        socket.join(`${socket.data.sensor.machine.factoryId}`);
        socket.join(`sensor_${socket.data.sensor.sensorId}`);
        socket.data.room = `${socket.data.sensor.machine.factoryId}`;
        socket.data.roomsensorId = socket.data.sensor.sensorId;
      } else if (user) {
        socket.data.user = user;
        socket.join(`${socket.data.user.factoryId}`);
        socket.data.room = `${socket.data.user.factoryId}`;
        if (socket.data.user.role === 'adminSystem') {
          console.warn('ALERT: O administrador do sistema está conectado ao websocket, mas não tem fabricas associadas, pelo que não receberá os dados dos sensores.');
        }
      }
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    if (!socket.data) {
      console.error('Socket data not found.');
      return;
    }
    if (socket.data.sensor) {
      console.log(`Authenticated sensor: ${socket.data.sensor.name} with ID ${socket.data.sensor.sensorId} connected.`);
    } else if (socket.data.user) {
      console.log(`Authenticated user: ${socket.data.user.name} connected.`);
    } else {
      console.log('Socket type not defined!');
    }
    socket.on('join_sensor', async (sensorId: number) => {
      const sensor = await SensorModel.findByPk(sensorId);
      const user = socket.data.user;
      console.log(`User ${user.name} is trying to connect to sensor ${sensorId}.`);
      if (!user) {
        console.error('User not found.');
        return;
      }
      if (!sensor) {
        console.error(`Sensor ${sensorId} not found.`);
        socket.emit('unauthorized', 'Sensor not found or sensor disconnected.');
        return new Error('Sensor not found or sensor disconnected.');
      }
      if (socket.data.user.role === 'adminSystem' || socket.data.user.role === 'admin' || socket.data.user.factoryId === sensor?.machine?.factoryId) {
        socket.leave(socket.data.room);
        socket.data.roomsensorId = `sensor_${sensorId}`;
        socket.join(socket.data.roomsensorId);
      } else {
        console.error(`User ${socket.data.user.name} does not have permission to access sensor ${sensorId}.`);
        socket.emit('unauthorized', 'You do not have permission to access this sensor.');
        socket.disconnect();
        return;
      }
    });
    socket.on('sensor_data', (value: any) => {
      try {
        const sensorId = socket.data.sensor.sensorId;
        const sensorToken = `sensor_${socket.handshake.auth.token}`;
        const data = {
          sensorId: sensorId,
          value: value,
          timestamp: new Date(),
          machineId: socket.data.sensor.machineId
        };
        socket.to(socket.data.room).emit('sensor_data', data);
        socket.to(`sensor_${sensorId}`).emit('sensor_data', data);

        let cachedData = cacheNode.get(sensorToken) as CachedSensorData[] || [];
        if (!Array.isArray(cachedData)) cachedData = [];
        cachedData.push(data);
        cacheNode.set(sensorToken, cachedData);

        console.log(`Data temporarily stored in cache for sensor ${sensorId}`);
      } catch (error) {
        console.error(`Error storing data in cache for sensor ${socket.data.sensor.sensorId}:`, error);
      }
    });

    socket.on('disconnecting', () => {

      if (socket.data.room) {
        socket.leave(socket.data.room);
      }
      if (socket.data.roomsensorId) {
        socket.leave(socket.data.roomsensorId);
      }
    
      if (socket.data.sensor) {
        console.log(`Sensor ${socket.data.sensor.sensorId} from machine ${socket.data.sensor.machine.machineName} is disconnecting.`);
        setTimeout(() => handleSensorDisconnect(socket), 5000);
      } else if (socket.data.user) {
        console.log(`User ${socket.data.user.name} is disconnecting.`);
      } else {
        console.log('Undefined socket type is disconnecting.');
      }
    });
    
    // Confirme que o socket será desconectado ao ser removido das salas
    socket.on('disconnect', () => {
      console.log('Socket fully disconnected.');
    });
  });
};

const handleSensorDisconnect = (socket: Socket) => {
  const sensorToken = `sensor_${socket.handshake.auth.token}`;
  const cachedData = cacheNode.get(sensorToken) as CachedSensorData[] || [];

  const hasValues = cachedData.some(item => item.value && Array.isArray(item.value.values) && item.value.values.length > 0);

  if (!hasValues) {
    cacheNode.del(sensorToken);
    console.log(`Cache for sensor ${socket.data.sensor.sensorId} has been cleared.`);
  } else {
    console.log(`Data still present in cache for sensor ${socket.data.sensor.sensorId}, postponing removal.`);
    setTimeout(() => handleSensorDisconnect(socket), 5000);
  }
};

const persistSensorDataFromCache = async () => {

  const allCachedData = cacheNode.keys()
    .filter(key => key.startsWith('sensor_'))
    .map(sensorToken => ({
      sensorToken,
      data: cacheNode.get(sensorToken) as CachedSensorData[] || [],
    }));

  for (const sensor of allCachedData) {
    const { sensorToken, data: cachedData } = sensor;

    if (cachedData.length > 0) {
      try {
        const sensorId = cachedData[0].sensorId;
        const machineId = cachedData[0].machineId;
        console.log(`Persisting data for sensor ${sensorId} with ${cachedData.length} entries.`);

        await DataModel.bulkCreate(
          cachedData.map((entry) => ({
            sensorId,
            value: entry.value,
            timestamp: entry.timestamp,
          }))
        );

        const structuredData: SensorData = {
          columns: COLUMNS_TO_USE,
          values: cachedData.map(entry => entry.value)
        };

        const anomalies = await anomalyDetectionHandler(structuredData, sensorId, machineId, cachedData);
        if (!anomalies) console.log(`No anomalies detected for sensor ${sensorId}.`);
        cacheNode.del(sensorToken);
      } catch (error) {
        console.error(`Error saving data for sensor ${cachedData[0]?.sensorId}:`, error);
      }
    } else {
      console.log(`No data in cache for sensor ${cachedData[0]?.sensorId}.`);
    }
  }
};

const anomalyState = new Map<number, boolean>();

const anomalyDetectionHandler = async (data: SensorData, sensorId: number, machineId: number, cachedData: CachedSensorData[]) => {
  const formattedData = {
    columns: data.columns,
    values: Array.isArray(data.values) && Array.isArray(data.values[0]?.values)
      ? (data.values as unknown as Array<{ values: number[] }>).map((sensorData: { values: number[] }) => sensorData.values)
      : data.values as number[][]
  };

  const anomalies = await tensor(formattedData).catch((error) => {
    console.error('Error processing with machine learning model:', error);
    return [];
  });

  let inAnomaly = anomalyState.get(sensorId) || false;

  if (Array.isArray(anomalies) && anomalies.length > 0) {
    anomalies.forEach(async (anomalyData, index) => {
      const correspondingData = cachedData[index];
      if (correspondingData) {
        const severity = determineSeverity(anomalyData.prediction);

        const details = Object.entries(correspondingData.value).map(([column, value]) => {
          const level = determineLevel(value as number);
          return `${column}: ${value} (${level})`;
        }).join(', ');

        const alertMessage = `Anomaly detected for sensor ${sensorId} on machine ${machineId}. Values: ${details}. Severity: ${severity}.`;

        if (anomalyData.prediction > 0.5 && !inAnomaly) {
          const alert = await AlertModel.create({
            machineId,
            sensorId,
            alertDate: correspondingData.timestamp,
            severity,
            message: alertMessage,
            state: 'awaiting analysis',
          });
          console.log(`Alert created with ID ${alert.alertId} for sensor ${sensorId} with severity ${severity}`);
          anomalyState.set(sensorId, true);  // Atualiza o estado de anomalia para true

          const users: UserDTO[] = cacheNode.keys().filter(key => key.startsWith('user_')).map(key => cacheNode.get(key) as UserDTO);
          console.log(`Sending notification to ${users.length} users.`);

          users.forEach((user: UserDTO) => {
            if (user?.deviceToken) {
              sendNotification(
                user.deviceToken,
                `Anomaly detected for sensor ${sensorId}`,
                alertMessage
              );
              console.log(`Notification sent to user ${user.name} with deviceToken ${user.deviceToken}`);
            }
          });
        } else if (anomalyData.prediction <= 0.5 && inAnomaly) {
          anomalyState.set(sensorId, false);
          console.log(`Sensor ${sensorId} anomaly resolved.`);
        }
      }
    });
    return anomalies;
  }

  anomalyState.set(sensorId, false);
  return null;
};


function determineSeverity(predictionScore: number): string {
  if (predictionScore > 0.9) return 'critical';
  if (predictionScore > 0.7) return 'high';
  if (predictionScore > 0.5) return 'medium';
  return 'low';
}

function determineLevel(value: number): string {
  // Example criterion, adjust as needed for your context
  return value > 100 ? 'High' : 'Low';
}

setInterval(persistSensorDataFromCache, 10000);