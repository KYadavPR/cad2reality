/**
 * CAD2Reality API Configuration
 * 
 * Change API_BASE_URL to your laptop's LAN IP when testing on a real device.
 * Example: 'http://192.168.1.100:8000'
 */

// For Android emulator, 10.0.2.2 maps to host machine's localhost
// For real device on same WiFi, use your laptop's LAN IP
export const API_BASE_URL = 'http://192.168.9.249:8000';

// API endpoints
export const API = {
  health: `${API_BASE_URL}/api/pipeline/health/`,
  upload: `${API_BASE_URL}/api/pipeline/upload/`,
  model: (filename: string) => `${API_BASE_URL}/api/pipeline/model/${filename}`,
  ar: (filename: string) => `${API_BASE_URL}/api/pipeline/ar/${filename}`,
};
