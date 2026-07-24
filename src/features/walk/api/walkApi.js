import apiClient from '../../../lib/apiClient';

const WALK_API_URL = import.meta.env.VITE_WALK_API_URL ?? '/api/walks';

/** JWT 로그인 사용자의 새 산책 기록을 시작한다. */
export async function startWalk() {
    const response = await apiClient.post(WALK_API_URL);
    return response.data;
}

/** GPS 좌표를 배열로 묶어서 로그인 사용자의 산책 기록에 저장한다. */
export async function saveWalkTrackPoints(walkId, trackPoints) {
    const response = await apiClient.post(
        `${WALK_API_URL}/${walkId}/track-points/batch`,
        { trackPoints }
    );
    return response.data;
}

/** 거리와 참여 반려동물 정보를 저장하고 산책을 종료한다. */
export async function completeWalk(walkId, requestData) {
    const response = await apiClient.patch(
        `${WALK_API_URL}/${walkId}/complete`,
        requestData
    );
    return response.data;
}

/** 로그인 사용자가 소유한 산책의 상세 정보를 조회한다. */
export async function getWalkDetail(walkId) {
    const response = await apiClient.get(`${WALK_API_URL}/${walkId}`);
    return response.data;
}

/** 로그인 사용자가 소유한 산책의 GPS 경로를 조회한다. */
export async function getWalkRoute(walkId) {
    const response = await apiClient.get(`${WALK_API_URL}/${walkId}/route`);
    return response.data;
}

/** 로그인 사용자가 소유한 산책의 제목과 메모를 수정한다. */
export async function updateWalk(walkId, requestData) {
    const response = await apiClient.patch(`${WALK_API_URL}/${walkId}`, requestData);
    return response.data;
}

/** 로그인 사용자가 소유한 산책을 삭제한다. */
export async function deleteWalk(walkId) {
    await apiClient.delete(`${WALK_API_URL}/${walkId}`);
}

/** 로그인 사용자의 월별 산책 날짜를 조회한다. */
export async function getWalkCalendar(year, month) {
    const response = await apiClient.get(`${WALK_API_URL}/calendar`, {
        params: { year, month },
    });
    return response.data;
}

/** 산책 사진을 파일 전송용 FormData에 담아 등록한다. */
export async function uploadWalkPhoto(walkId, imageFile, location) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('caption', '산책 중 촬영한 사진');
    formData.append('takenAt', new Date().toISOString());

    if (location) {
        formData.append('latitude', String(location.latitude));
        formData.append('longitude', String(location.longitude));
    }

    const response = await apiClient.post(`${WALK_API_URL}/${walkId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

/** 로그인 사용자가 소유한 산책 사진을 삭제한다. */
export async function deleteWalkPhoto(walkId, photoId) {
    await apiClient.delete(`${WALK_API_URL}/${walkId}/photos/${photoId}`);
}

/** 로그인 사용자가 소유한 산책 사진 목록을 조회한다. */
export async function getWalkPhotos(walkId) {
    const response = await apiClient.get(`${WALK_API_URL}/${walkId}/photos`);
    return response.data;
}
