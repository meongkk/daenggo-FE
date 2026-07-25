import axios from 'axios';
import {
  clearTokens,
  getStoredTokens,
  notifyAuthExpired,
  saveTokens,
} from '../features/auth/api/tokenStorage';

// Axios가 일반 객체는 JSON으로, FormData는 multipart/form-data로 자동 구분한다.
// FormData의 Content-Type을 직접 고정하면 브라우저가 만드는 boundary가 빠질 수 있다.
const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  if (config.skipAuth) {
    return config;
  }

  const tokens = getStoredTokens();

  if (tokens?.accessToken) {
    config.headers.Authorization = `${tokens.tokenType || 'Bearer'} ${tokens.accessToken}`;
  }

  return config;
});

let refreshPromise = null;

async function refreshTokens(refreshToken) {
  if (!refreshPromise) {
    refreshPromise = axios.post('/api/auth/reissue', { refreshToken })
      .then((response) => {
        saveTokens(response.data);
        return response.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function expireSession() {
  clearTokens();
  notifyAuthExpired();
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401
      || originalRequest?.skipAuth
      || originalRequest?._retry
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getStoredTokens()?.refreshToken;

    if (!refreshToken) {
      expireSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const tokens = await refreshTokens(refreshToken);
      originalRequest.headers.Authorization =
        `${tokens.tokenType || 'Bearer'} ${tokens.accessToken}`;
      if (originalRequest.url === '/api/auth/logout') {
        originalRequest.data = { refreshToken: tokens.refreshToken };
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      expireSession();
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
