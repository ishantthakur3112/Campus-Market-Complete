import axios from "axios";

export const API_BASE_URL = "https://campus-market-complete.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically inject token headers on all requests if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // CHANGED: Only trigger the global backend instance loader on the absolute first page hit
    const hasWokenUp = sessionStorage.getItem("server_instance_woken");
    if (!hasWokenUp) {
      // Create and mount the dark overlay spinner window
      const loader = document.createElement("div");
      loader.id = "global-instance-loader";
      loader.innerHTML = `
        <div class="instance-spinner-card">
          <div class="instance-spinner"></div>
          <h2>Waking up the server instance...</h2>
          <p>Please allow up to 50-90 seconds for the initial cold-start load. Thank you for your patience!</p>
        </div>
      `;
      document.body.appendChild(loader);
      
      // Mark as woken up immediately so no secondary clicks trigger this element
      sessionStorage.setItem("server_instance_woken", "true");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Clean up the loader element as soon as any response comes back
api.interceptors.response.use(
  (response) => {
    const loader = document.getElementById("global-instance-loader");
    if (loader) loader.remove();
    return response;
  },
  (error) => {
    const loader = document.getElementById("global-instance-loader");
    if (loader) loader.remove();
    return Promise.reject(error);
  }
);

export default api;