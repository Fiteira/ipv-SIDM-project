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
      console.log('Notificação enviada com sucesso:', data);
    } else {
      const errorData = await response.json();
      console.error('Erro ao enviar notificação:', errorData);
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
};
