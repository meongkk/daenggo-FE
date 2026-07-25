import apiClient from '../../../lib/apiClient';

export const PROFILE_IMAGE_MAX_SIZE = 10 * 1024 * 1024;
export const PROFILE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

async function uploadProfileImage(apiUrl, imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await apiClient.post(apiUrl, formData);

  if (!response.data?.imageUrl) {
    throw new Error('서버에서 이미지 주소를 받지 못했습니다.');
  }

  return response.data.imageUrl;
}

export function uploadUserImage(imageFile) {
  return uploadProfileImage('/api/users/images', imageFile);
}

export function uploadPetImage(imageFile) {
  return uploadProfileImage('/api/pets/images', imageFile);
}

export async function loadPrivateProfileImage(imageUrl, { signal } = {}) {
  const response = await apiClient.get(imageUrl, {
    responseType: 'blob',
    signal,
  });

  return URL.createObjectURL(response.data);
}
