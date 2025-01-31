const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const API_URL = `${BASE_URL}/api`;
export const WS_URL = BASE_URL.replace(/^http/, 'ws');
