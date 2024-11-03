import * as admin from 'firebase-admin';
import * as serviceAccount from '../../sidm-ca6cc-firebase-adminsdk-t3hve-691e3f9dc9.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
}); 

export const enviarNotificacao = async (
    token: string,
    titulo: string,
    corpo: string
  ) => {
    const mensagem = {
      to: token,
      sound: 'default',
      title: titulo,
      body: corpo,
      data: { someData: 'goes here' },
    };
  
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mensagem),
      });
  
      if (response.ok) {
        const data = await response.json();
  
        if (Array.isArray(data.data)) {
          // Caso data seja um array
          data.data.forEach((ticket: any) => {
            if (ticket.id) {
              console.log('Notificação enviada com sucesso. Ticket ID:', ticket.id);
              // Aguardar antes de verificar o recibo
              setTimeout(() => verificarRecibo(ticket.id), 5000);
            } else {
              console.error('Ticket sem ID:', ticket);
            }
          });
        } else if (data.data && data.data.id) {
          // Caso data seja um objeto
          console.log('Notificação enviada com sucesso. Ticket ID:', data.data.id);
          // Aguardar antes de verificar o recibo
          setTimeout(() => verificarRecibo(data.data.id), 5000);
        } else {
          console.error('Resposta inesperada:', data);
        }
      } else {
        const errorData = await response.json();
        console.error('Erro ao enviar notificação:', errorData);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  const verificarRecibo = async (ticketId: string) => {
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [ticketId] }),
      });
  
      if (response.ok) {
        const data = await response.json();
        const receipt = data.data[ticketId];
  
        if (receipt.status === 'ok') {
          console.log('Notificação entregue com sucesso.');
        } else if (receipt.status === 'error') {
          console.error(
            `Erro na entrega da notificação: ${receipt.message}`,
            receipt.details
          );
        }
      } else {
        const errorData = await response.json();
        console.error('Erro ao obter recibo:', errorData);
      }
    } catch (error) {
      console.error('Erro ao obter recibo:', error);
    }
  };
  