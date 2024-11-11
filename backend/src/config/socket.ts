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
import { MachineModel } from '../models/machine.model';
import { UserModel } from '../models/user.model';
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
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.error('Authentication error: Token required.');
      return next(new Error('Authentication error: Token required.'));
    }

    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
      console.error('JWT secret key is missing.');
      return next(new Error('Internal server error: JWT secret key is missing.'));
    }

    jwt.verify(token, secretKey, async (err: VerifyErrors | null, decoded: any) => {
      if (err) {
        console.error('Token verification error:', err);
        return next(new Error('Invalid or expired token. Connection rejected.'));
      }

      try {
        if (decoded.userId) {
          // User authentication
          const userId = decoded.userId;
          let user: any = cacheNode.get(`user_${userId}`);

          if (!user) {
            console.log('User not found in cache. Retrieving from database.');
            user = await UserModel.findByPk(userId, {
              attributes: ['userId', 'role', 'factoryId', 'name', 'userNumber'],
            });
            if (user) {
              cacheNode.set(`user_${userId}`, user);
            } else {
              console.error('User not found in database.');
              return next(new Error('Invalid or expired token. Connection rejected.'));
            }
          }

          socket.data.user = user;
          socket.join(`${user.factoryId}`);
          socket.data.room = `${user.factoryId}`;

          if (user.role === 'adminSystem') {
            console.warn(
              'ALERT: System administrator connected to websocket but has no associated factories, so they will not receive sensor data.'
            );
          }
        } else if (decoded.sensorId) {
          const sensorId = decoded.sensorId;
          let sensor: any = cacheNode.get(`sensor_${sensorId}`);

          if (!sensor) {
            console.log('Sensor not found in cache. Retrieving from database.');
            sensor = await SensorModel.findByPk(sensorId, {
              include: [
                {
                  model: MachineModel,
                  as: 'machine',
                  attributes: ['machineId', 'machineName', 'factoryId'],
                },
              ],
            });
            if (sensor) {
              cacheNode.set(`sensor_${sensorId}`, sensor);
            } else {
              console.error('Sensor not found in database.');
              return next(new Error('Invalid or expired token. Connection rejected.'));
            }
          }

          socket.data.sensor = sensor;
          socket.join(`${sensor.machine.factoryId}`);
          socket.join(`sensor_${sensor.sensorId}`);
          socket.data.room = `${sensor.machine.factoryId}`;
          socket.data.roomsensorId = `sensor_${sensor.sensorId}`;
        } else {
          console.error('Token payload does not contain userId or sensorId.');
          return next(new Error('Invalid token payload.'));
        }

        next();
      } catch (error) {
        console.error('Error during authentication:', error);
        return next(new Error('Authentication error.'));
      }
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
      const sensor = await SensorModel.findByPk(sensorId, {
        include: [
          {
            model: MachineModel,
            as: 'machine',
            attributes: ['machineId', 'factoryId'],
          },
        ],
      });
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
    
      if (socket.data.user.role === 'adminSystem') {
        // Allow 'adminSystem' to access any sensor
        socket.leave(socket.data.room);
        socket.data.roomsensorId = `sensor_${sensorId}`;
        socket.join(socket.data.roomsensorId);
      } else if (
        sensor.machine &&
        sensor.machine.factoryId &&
        sensor.machine.factoryId === socket.data.user.factoryId
      ) {
        socket.leave(socket.data.room);
        socket.data.roomsensorId = `sensor_${sensorId}`;
        socket.join(socket.data.roomsensorId);
      } else {
        // Deny access to other sensors
        console.error(
          `User ${socket.data.user.name} does not have permission to access sensor ${sensorId}.`
        );
        socket.emit('unauthorized', 'You do not have permission to access this sensor.');
        socket.disconnect();
        return;
      }
    });
    socket.on('sensor_data', (value: any) => {
      try {
        const sensorId = socket.data.sensor.sensorId;
        const sensorKey = `sensor_${sensorId}`;
        const data = {
          sensorId: sensorId,
          value: value,
          timestamp: new Date(),
          machineId: socket.data.sensor.machineId
        };
        socket.to(socket.data.room).emit('sensor_data', data);
        socket.to(`sensor_${sensorId}`).emit('sensor_data', data);
    
        let cachedData = cacheNode.get(sensorKey) as CachedSensorData[] || [];
        if (!Array.isArray(cachedData)) cachedData = [];
        cachedData.push(data);
        cacheNode.set(sensorKey, cachedData);
    
        console.log(`Data temporarily stored in cache for sensor ${sensorId}`);
      } catch (error) {
        console.error(`Error storing data in cache for sensor:`, error);
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
    
    socket.on('disconnect', () => {
      console.log('Socket fully disconnected.');
    });
  });
};

const handleSensorDisconnect = (socket: Socket) => {
  const sensorId = socket.data.sensor.sensorId;
  const sensorKey = `sensor_${sensorId}`;
  const cachedData = cacheNode.get(sensorKey) as CachedSensorData[] || [];

  const hasValues = cachedData.some(item => item.value && Array.isArray(item.value.values) && item.value.values.length > 0);

  if (!hasValues) {
    cacheNode.del(sensorKey);
    console.log(`Cache for sensor ${sensorId} has been cleared.`);
  } else {
    console.log(`Data still present in cache for sensor ${sensorId}, postponing removal.`);
    setTimeout(() => handleSensorDisconnect(socket), 5000);
  }
};


const persistSensorDataFromCache = async () => {
  const allCachedData = cacheNode.keys()
    .filter(key => key.startsWith('sensor_'))
    .map(sensorKey => ({
      sensorKey,
      data: cacheNode.get(sensorKey) as CachedSensorData[] || [],
    }));

  for (const sensor of allCachedData) {
    const { sensorKey, data: cachedData } = sensor;

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
        cacheNode.del(sensorKey);
      } catch (error) {
        console.error(`Error saving data for sensor ${cachedData[0]?.sensorId}:`, error);
      }
    } else {
      console.log(`No data in cache for sensor ${cachedData[0]?.sensorId}.`);
      console.log(`Cached data: ${JSON.stringify(cachedData)}`);
    }
  }
};


const anomalyState = new Map<number, boolean>();

const anomalyDetectionHandler = async (
  data: SensorData,
  sensorId: number,
  machineId: number,
  cachedData: CachedSensorData[]
) => {
  const formattedData = {
    columns: data.columns,
    values: Array.isArray(data.values) && Array.isArray(data.values[0]?.values)
      ? (data.values as unknown as Array<{ values: number[] }>).map((sensorData: { values: number[] }) => sensorData.values)
      : (data.values as number[][])
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

        // Ajuste aqui: Mapear colunas e valores corretamente
        const details = correspondingData.value.columns.map((column: ColumnName, idx: number) => {
          const value = correspondingData.value.values[idx];
          const level = determineLevel(value as number, column);
          return `${column}: ${value} (${level})`;
        }).join(', ');

        console.log("-------------------");
        console.log("Details:", details);
        console.log("-------------------");

        const alertMessage = `Severity: ${severity} \nDetails: ${details}.`;

        if (anomalyData.prediction > 0.5 && !inAnomaly) {
          const alert = await AlertModel.create({
            machineId,
            sensorId,
            alertDate: correspondingData.timestamp,
            severity,
            message: alertMessage,
            state: 'awaiting analysis',
          });
          inAnomaly = true;

          const users: UserDTO[] = cacheNode.keys().filter(key => key.startsWith('user_')).map(key => cacheNode.get(key) as UserDTO);
          console.log(`Sending notification to ${users.length} users.`);

          users.forEach((user: UserDTO) => {
            if (user?.deviceToken) {
              sendNotification(
                user.deviceToken,
                `Anomaly detected for sensor ${sensorId} on machine ${machineId}`,
                alertMessage
              );
              console.log(`Notification sent to user ${user.name} with deviceToken ${user.deviceToken}`);
            }
          });
        } else {
          console.warn("Insufficient data to create alert: machineId or sensorId is missing.");
          inAnomaly = false;
        }
      }
    });
    return anomalies;
  }
  return null;
};

function determineSeverity(predictionScore: number): string {
  if (predictionScore > 0.9) return 'critical';
  if (predictionScore > 0.7) return 'high';
  if (predictionScore > 0.5) return 'medium';
  return 'low';
}

type ColumnName = 'Air temperature [K]' | 'Process temperature [K]' | 'Rotational speed [rpm]' | 'Torque [Nm]' | 'Tool wear [min]';

function determineLevel(value: number, column: ColumnName): string {
  const thresholds: Record<ColumnName, number> = {
    'Air temperature [K]': 300,
    'Process temperature [K]': 310,
    'Rotational speed [rpm]': 1500,
    'Torque [Nm]': 50,
    'Tool wear [min]': 100,
  };

  const threshold = thresholds[column];
  console.log(`Processing ${column}: threshold is ${threshold}, value is ${value}`);

  return value > threshold ? 'High' : 'Normal';
}

setInterval(persistSensorDataFromCache, 10000);