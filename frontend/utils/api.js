// frontend/utils/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',   // Django backend
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true               // important for Django session cookies
});

export default api;
