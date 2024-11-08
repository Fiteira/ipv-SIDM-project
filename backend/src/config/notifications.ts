import * as admin from 'firebase-admin';
import * as serviceAccount from '../../sidm-ca6cc-firebase-adminsdk-t3hve-691e3f9dc9.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});

export const sendNotification = async (
  token: string,
  title: string,
  body: string
) => {
  const message = {
    to: token,
    sound: 'default',
    title: title,
    body: body,
    data: { someData: 'goes here' },
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Notification sent successfully:', data);
    } else {
      const errorData = await response.json();
      console.error('Error sending notification:', errorData);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
