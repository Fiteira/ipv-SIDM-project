import axios from 'axios';

let api_url = 'http://192.168.68.108:3000/api';
console.log('------------------------SE A API ESTIVER EM OUTRO IP, MUDE O IP NO ARQUIVO frontend/config/api.ts----------------------------');

const api = axios.create({
  baseURL: api_url,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;