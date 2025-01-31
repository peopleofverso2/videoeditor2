const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const config = {
  apiUrl,
  wsUrl: apiUrl.replace(/^http/, 'ws'),
  frontendPort: 3001,  // Pour référence locale uniquement
  publicUrl: import.meta.env.VITE_PUBLIC_URL || window.location.origin
};

export default config;
