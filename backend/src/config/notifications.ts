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
  if (!token) {
    console.error('No token provided');
    return;
  } else if (!title) {
    console.error('No title provided');
    return;
  } else if (!body) {
    console.error('No body provided');
    return;
  } 
  const message = {
    to: token,
    sound: 'default',
    title: title,
    body: body
  };

  console.log(message);
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
