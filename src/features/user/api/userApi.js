import apiClient from '../../../lib/apiClient';

export async function searchUsers(nickname, { signal } = {}) {
  const response = await apiClient.get('/api/users/search', {
    params: { nickname },
    signal,
  });
  return response.data;
}

export async function getMyInfo({ signal } = {}) {
  const response = await apiClient.get('/api/users/me', { signal });
  return response.data;
}

export async function updateMyInfo(request) {
  const response = await apiClient.patch('/api/users/me', request);
  return response.data;
}

export async function changePassword(request) {
  await apiClient.patch('/api/users/me/password', request);
}

export async function withdrawMyAccount() {
  await apiClient.delete('/api/users/me');
}
