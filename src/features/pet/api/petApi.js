import apiClient from '../../../lib/apiClient';

export async function getBreeds({ signal } = {}) {
  const response = await apiClient.get('/api/breeds', {
    signal,
    skipAuth: true,
  });
  return response.data;
}

export async function getMyPets({ signal } = {}) {
  const response = await apiClient.get('/api/pets', { signal });
  return response.data;
}

export async function getMyPet(petId, { signal } = {}) {
  const response = await apiClient.get(`/api/pets/${petId}`, { signal });
  return response.data;
}

export async function createPet(request) {
  const response = await apiClient.post('/api/pets', request);
  return response.data;
}

export async function updatePet(petId, request) {
  const response = await apiClient.patch(`/api/pets/${petId}`, request);
  return response.data;
}

export async function setPrimaryPet(petId) {
  await apiClient.patch(`/api/pets/${petId}/primary`);
}

export async function deletePet(petId) {
  await apiClient.delete(`/api/pets/${petId}`);
}
