import apiClient from '../../../lib/apiClient';

export async function getMyGroups({ signal } = {}) {
  const response = await apiClient.get('/api/groups', { signal });
  return response.data;
}

export async function getGroupDetail(groupId, { signal } = {}) {
  const response = await apiClient.get(`/api/groups/${groupId}`, { signal });
  return response.data;
}

export async function getGroupMembers(groupId, { signal } = {}) {
  const response = await apiClient.get(`/api/groups/${groupId}/members`, { signal });
  return response.data;
}

export async function getGroupPets(groupId, { signal } = {}) {
  const response = await apiClient.get(`/api/groups/${groupId}/pets`, { signal });
  return response.data;
}

export async function addGroupMember(groupId, userId) {
  const response = await apiClient.post(`/api/groups/${groupId}/members`, { userId });
  return response.data;
}

export async function createGroup(request) {
  const response = await apiClient.post('/api/groups', request);
  return response.data;
}

export async function updateGroup(groupId, request) {
  const response = await apiClient.patch(`/api/groups/${groupId}`, request);
  return response.data;
}

export async function transferOwnership(groupId, memberId) {
  const response = await apiClient.patch(`/api/groups/${groupId}/owner`, { memberId });
  return response.data;
}

export async function leaveGroup(groupId) {
  await apiClient.delete(`/api/groups/${groupId}/members/me`);
}

export async function kickMember(groupId, memberId) {
  await apiClient.delete(`/api/groups/${groupId}/members/${memberId}`);
}

export async function deleteGroup(groupId) {
  await apiClient.delete(`/api/groups/${groupId}`);
}
