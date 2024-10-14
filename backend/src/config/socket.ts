import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import cacheNode from './cache'; // Importe a cache usada para armazenar o sensor


// Função que configura os eventos de WebSocket
export const configureSocketEvents = (io: SocketIOServer) => {
  // Middleware para validar o token JWT e verificar o sensor na cache antes de permitir a conexão
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    console.log('Token recebido:', token);

    // Se o token não foi fornecido, rejeitar a conexão
    if (!token) {
      return next(new Error('Autenticação requerida. Token não fornecido.'));
    }

    // Recuperar o sensor da cache com base no token
    const sensor = cacheNode.get(token);
    console.log('Sensor encontrado na cache:', sensor);
    if (!sensor) {
      return next(new Error('Token inválido ou expirado.'));
    }
    console.log('Vai verificar o token JWT...');
    // Verificar o token JWT manualmente
    jwt.verify(token, "mudar" as string, (err: VerifyErrors | null) => { //////////////Corrigir a parte dos erros////////////////////////////
      if (err) {
        return next(new Error('Token inválido. Conexão rejeitada.'));
      }
      console.log('Token verificado com sucesso!');
      // Se o token for válido, associar o sensor ao socket
      socket.data.sensor = sensor;
      next(); // Continuar a conexão
    });
    console.log('Middleware de autenticação concluído.');
  });

  // Gerenciar os eventos depois que a conexão foi autenticada
  io.on('connection', (socket: Socket) => {
    console.log(`Sensor autenticado: ${socket.data.sensor.name} com id ${socket.data.sensor.sensorId} conectado!`);

    // Evento para receber dados do sensor
    socket.on('sensor_data', (data) => {
      console.log(`Dados recebidos do sensor ${socket.data.sensor.sensorId}:`, data);

      // Aqui você pode processar os dados do sensor e salvar no banco de dados
    });

    // Evento de desconexão
    socket.on('disconnect', () => {
      console.log(`Sensor com id ${socket.data.sensor.sensorId} e nome ${socket.data.sensor.name} desconectado`);
    });
  });
};
