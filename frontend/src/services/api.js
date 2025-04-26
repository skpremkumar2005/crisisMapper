import axios from 'axios';

// Use VITE_ prefix for environment variables in Vite
const API_URL ='http://localhost:5001/api';
// For Create React App, use process.env.REACT_APP_API_URL

const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor to add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Response Interceptor (e.g., for handling 401 errors globally)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      console.error("Unauthorized access - 401 Interceptor");
      // TODO: Redirect to login or refresh token logic
      localStorage.removeItem('userInfo');
      // Potentially redirect using window.location or react-router history
       window.location.href = '/login'; // Simple redirect
    }
    return Promise.reject(error);
  }
);


export default api;