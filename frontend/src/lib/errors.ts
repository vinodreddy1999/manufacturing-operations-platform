import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data && typeof error.response.data === 'object' && 'detail' in error.response.data) {
      return String(error.response.data.detail);
    }
    if (error.code === 'ECONNABORTED') {
      return 'The backend request timed out. Check that the API is reachable.';
    }
    if (error.message === 'Network Error') {
      return 'Cannot reach the backend API. Verify the backend is running and CORS is configured.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error';
}
