import axios from 'axios';

let api_url = 'http://localhost:3000';
console.log('API_URL: ');

const api = axios.create({
  baseURL: api_url,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;