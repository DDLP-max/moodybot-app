// Environment configuration for MoodyBot WebApp
export const config = {
  // Base URLs
  production: {
    baseUrl: 'https://app.moodybot.ai',
    apiUrl: 'https://app.moodybot.ai/api'
  },
  development: {
    baseUrl: 'http://localhost:10000',
    apiUrl: 'http://localhost:10000/api'
  }
};

// Get current environment
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';

// Get appropriate URLs based on environment
export const getBaseUrl = () => isProduction ? config.production.baseUrl : config.development.baseUrl;
export const getApiUrl = () => isProduction ? config.production.apiUrl : config.development.apiUrl;

// Share URL for social sharing
export const getShareUrl = () => isProduction ? config.production.baseUrl : window.location.href;
