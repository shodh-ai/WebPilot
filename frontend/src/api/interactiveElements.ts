import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api', 
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});

export const interactiveElementsApi = {
  async getInteractiveElements(route?: string) {
    try {
      const safeRoute = route?.trim() || '/';
      const response = await apiClient.get('/interactive-elements', {
        params: { route: safeRoute.startsWith('/') ? safeRoute : `/${safeRoute}` }
      });

      return response.data;
    } catch (error: any) {
      return {
        route: route || '/',
        elements: null,
        error: error.response?.data?.message || 'Failed to fetch interactive elements'
      };
    }
  }
};