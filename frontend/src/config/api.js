import axios from 'axios';

// 1. Maintain your existing environment base URL export
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// 2. Instantiate a central Axios engine bound to that URL
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// 3. Set up the connecting reference for your React loading state
let setIsLoadingGlobal = null;

export const attachLoadingInterceptor = (setIsLoadingFn) => {
  setIsLoadingGlobal = setIsLoadingFn;
};

// 4. Request Interceptor (API calls trigger -> turns loading spinner ON)
api.interceptors.request.use(
  (config) => {
    if (setIsLoadingGlobal) setIsLoadingGlobal(true);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (setIsLoadingGlobal) setIsLoadingGlobal(false);
    return Promise.reject(error);
  }
);

// 5. Response Interceptor (Data returns/fails -> turns loading spinner OFF)
api.interceptors.response.use(
  (response) => {
    if (setIsLoadingGlobal) setIsLoadingGlobal(false);
    return response;
  },
  (error) => {
    if (setIsLoadingGlobal) setIsLoadingGlobal(false);
    return Promise.reject(error);
  }
);

export default api;