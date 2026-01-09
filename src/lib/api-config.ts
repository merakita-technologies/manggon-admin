/**
 * API Configuration
 * Centralized configuration for API endpoints
 * 
 * For local network testing (PWA on mobile), use your local IP address
 * Get your IP: Windows: ipconfig | findstr IPv4, Mac/Linux: ifconfig | grep inet
 * 
 * Default: http://192.168.1.3:3010 (change this to your actual local IP)
 */

// Change this to your local IP address for network testing
// Common local IP ranges: 192.168.1.x, 192.168.0.x, 10.0.0.x
const LOCAL_IP = process.env.NEXT_PUBLIC_LOCAL_IP || '192.168.1.3'

// Base URL for API - uses IP for local network access
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || `http://${LOCAL_IP}:3010/api/v1`

// GraphQL endpoint
export const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || `http://${LOCAL_IP}:3010/graphql` || `http://${LOCAL_IP}:3010/graphql`

// WebSocket endpoint
export const WEBSOCKET_ENDPOINT = process.env.NEXT_PUBLIC_WEBSOCKET_URL || `http://${LOCAL_IP}:3010`

// Backend base URL (without path)
export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || `http://${LOCAL_IP}:3010`

