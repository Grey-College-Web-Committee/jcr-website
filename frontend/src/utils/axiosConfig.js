import axios from 'axios';

// Allows cookie-based auth on all requests to the API
// Also sets the base URL
const api = axios.create({
  withCredentials: true,
  baseURL: "/api"
});

export default api;
