const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  wsUrl: 'ws://localhost:4000',
  frontendPort: 3001,  // Pour référence
  publicUrl: import.meta.env.VITE_PUBLIC_URL || window.location.origin
};

export default config;
