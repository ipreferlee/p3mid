import Config from 'react-native-config';

// Provide a fallback URL in case Config.VITE_API_ENDPOINT is undefined
export const API_ENDPOINT = Config.VITE_API_ENDPOINT || 'https://backend-8-br78.onrender.com/api';

// For debugging
console.log('API_ENDPOINT from Api.js:', API_ENDPOINT);