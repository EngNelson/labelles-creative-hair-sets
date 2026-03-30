import { fetchWithConfig } from "./config";

// Re-export the enhanced fetch function as fetchData for backward compatibility
export const fetchData = fetchWithConfig;

// Export the new enhanced function
export {
  fetchWithConfig,
  getApiConfig,
  getAuthHeaders,
  buildQueryString,
  API_ENDPOINTS,
} from "./config";
