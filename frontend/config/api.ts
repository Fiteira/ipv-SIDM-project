import axios from 'axios';

let api_url = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
console.log('------------------------SE A API ESTIVER EM OUTRO IP, MUDE O IP NO ARQUIVO frontend/config/api.ts----------------------------');

const api = axios.create({
  baseURL: api_url,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;