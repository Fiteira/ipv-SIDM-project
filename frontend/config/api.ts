import axios from 'axios';

let api_url = 'http://192.168.1.144:3000/api';
console.log('API_URL: ');

const api = axios.create({
  baseURL: api_url,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;