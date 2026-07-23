import axios from 'axios';
// 임시 사용자
const TEMP_USER_ID = Number(
    import.meta.env.VITE_WALK_USER_ID ?? 1
);

// API 주소가 바뀌어도 이 값(.env) 하나만 수정하도록 기본 주소를 한곳에서 관리합니다.
const WALK_API_URL = import.meta.env.VITE_WALK_API_URL ?? '/api/walks';


// 산책 시작: 백엔드가 새 기록을 만들고 walkRecordId를 돌려줍니다.
export async function startWalk() {
    const response = await axios.post(WALK_API_URL, {},
        {   params: {
                userId: TEMP_USER_ID,
            },
        headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
}

// GPS 좌표를 한 개씩 보내지 않고 배열로 묶어 전송해 서버 요청 횟수를 줄입니다.
export async function saveWalkTrackPoints(walkId, userId, trackPoints) {
    const response = await axios.post(
        `${WALK_API_URL}/${walkId}/track-points/batch?userId=${userId}`,
        {trackPoints},
        { headers: { 'Content-Type': 'application/json' } },
    );
    return response.data;
}

// 산책 종료: 마지막 거리와 참여한 반려동물 정보를 저장합니다.
export async function completeWalk(walkId, userId, requestData) {
    const response = await axios.patch(
        `${WALK_API_URL}/${walkId}/complete?userId=${userId}`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } },
    );
    return response.data;
}

// 산책 상세 정보(제목, 시간, 거리, 메모 등)를 가져옵니다.
export async function getWalkDetail(walkId, userId) {
    const response = await axios.get(`${WALK_API_URL}/${walkId}?userId=${userId}`);
    return response.data;
}

// 지도에 그릴 GPS 경로 좌표 목록을 가져옵니다.
export async function getWalkRoute(walkId , userId) {
    const response = await axios.get(`${WALK_API_URL}/${walkId}/route?userId=${userId}`);
    return response.data;
}

// 사용자가 바꾼 산책 제목과 메모를 저장합니다.
export async function updateWalk(walkId, requestData) {
    const response = await axios.patch(`${WALK_API_URL}/${walkId}`, requestData, {
        headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
}

// 선택한 산책 기록과 연결된 경로/사진을 삭제합니다.
export async function deleteWalk(walkId) {
    await axios.delete(`${WALK_API_URL}/${walkId}`);
}

// 달력에 발바닥 표시를 할 산책 날짜 목록을 월 단위로 가져옵니다.
export async function getWalkCalendar(year, month) {
    const response = await axios.get(`${WALK_API_URL}/calendar`, {
        params: { userId: TEMP_USER_ID, year, month },
    });
    return response.data;
}

// 사진 파일은 JSON이 아니므로 FormData(파일 전송용 상자)에 담아 보냅니다.
export async function uploadWalkPhoto(userId, walkId, imageFile, location) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('caption', '산책 중 촬영한 사진');
    formData.append('takenAt', new Date().toISOString());

    if (location) {
        formData.append('latitude', String(location.latitude));
        formData.append('longitude', String(location.longitude));
    }

    // Content-Type은 직접 쓰지 않습니다. 브라우저가 파일 경계값까지 자동으로 붙여줍니다.
    const response = await axios.post(`${WALK_API_URL}/${walkId}/photos?userId=${userId}`, formData);
    return response.data;
}

// 등록된 사진 한 장을 photoId로 찾아 삭제합니다.
export async function deleteWalkPhoto(userId, walkId, photoId) {
    await axios.delete(`${WALK_API_URL}/${walkId}/photos/${photoId}?userId=${userId}`);
}
