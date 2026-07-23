import axios from 'axios';

const PLACE_API_URL = import.meta.env.VITE_PLACE_API_URL ?? '/api/places';

/**
 * 현재 카카오 지도에 보이는 범위 안에서 반려동물 동반 장소를 조회합니다.
 * 백엔드가 원래 지원하는 좌표와 category만 전달합니다.
 */
export async function getNearbyPlaces({ bounds, category }) {
  const response = await axios.get(`${PLACE_API_URL}/nearby`, {
    params: {
      swLat: bounds.swLat,
      swLng: bounds.swLng,
      neLat: bounds.neLat,
      neLng: bounds.neLng,
      category: category || undefined,
    },
  });

  return response.data;
}

/** 마커를 누른 장소의 주소·전화번호·반려동물 조건을 조회합니다. */
export async function getPlaceDetail(placeId) {
  const response = await axios.get(`${PLACE_API_URL}/${placeId}`);
  return response.data;
}
