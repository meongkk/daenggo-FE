import apiClient from '../../../lib/apiClient';

const API_ORIGIN = (
  import.meta.env.VITE_API_ORIGIN || 'http://localhost:8080'
).replace(/\/+$/, '');

export function getKakaoLoginUrl() {
  return `${API_ORIGIN}/api/auth/oauth2/authorization/kakao`;
}

export async function login({ email, password }) {
  const response = await apiClient.post('/api/auth/login', {
    email,
    password,
  }, {
    skipAuth: true,
  });

  return response.data;
}

export async function signup(request) {
  const response = await apiClient.post('/api/auth/signup', request, {
    skipAuth: true,
  });
  return response.data;
}

export async function checkEmail(email) {
  const response = await apiClient.get('/api/auth/check-email', {
    params: { email },
    skipAuth: true,
  });
  return response.data.available;
}

export async function checkNickname(nickname) {
  const response = await apiClient.get('/api/auth/check-nickname', {
    params: { nickname },
    skipAuth: true,
  });
  return response.data.available;
}

export async function logout(refreshToken) {
  await apiClient.post('/api/auth/logout', { refreshToken });
}

export async function exchangeOAuthToken() {
  const response = await apiClient.post(
    `${API_ORIGIN}/api/auth/oauth/token`,
    null,
    {
      skipAuth: true,
      withCredentials: true,
    },
  );

  return response.data;
}

export async function completeOAuthSignup(nickname) {
  const response = await apiClient.post(
    `${API_ORIGIN}/api/auth/oauth/signup`,
    { nickname },
    {
      skipAuth: true,
      withCredentials: true,
    },
  );

  return response.data;
}
