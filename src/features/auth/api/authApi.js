import apiClient from '../../../lib/apiClient';

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
