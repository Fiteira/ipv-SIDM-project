import { Server as SocketIOServer, Socket } from 'socket.io';

// Função que configura os eventos de WebSocket
export const configureSocketEvents = (io: SocketIOServer) => {
  io.on('connection', (socket: Socket) => {
    console.log('Novo cliente conectado!');

    // Evento para receber dados do sensor
    socket.on('sensor_data', (data) => {
      console.log('Dados recebidos do sensor:', data);

      // Aqui você pode processar os dados do sensor e salvar no banco de dados
    });

    // Evento de desconexão
    socket.on('disconnect', () => {
      console.log('Cliente desconectado');
    });
  });
};
