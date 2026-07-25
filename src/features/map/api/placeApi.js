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

/**
 * 지도 범위와 무관하게 전국에서 장소명·주소로 검색합니다.
 * 백엔드가 장소명이 일치하는 결과를 먼저 정렬해서 반환합니다.
 */
export async function searchPlacesByKeyword(keyword, page = 0, size = 20) {
  const response = await axios.get(`${PLACE_API_URL}/search`, {
    params: { keyword, page, size },
  });

  return response.data; // { content, totalElements, totalPages, last, ... }
}

/** 데이터가 존재하는 지역과 장소 개수 목록을 조회합니다. 지역 선택 UI에 사용합니다. */
export async function getRegionList() {
  const response = await axios.get(`${PLACE_API_URL}/regions/list`);
  return response.data; // [{ region, count }, ...]
}

/** 특정 지역(예: "서울특별시")의 장소를 조회합니다. */
export async function getPlacesByRegion(region, category, page = 0, size = 20) {
  const response = await axios.get(`${PLACE_API_URL}/regions`, {
    params: { region, category: category || undefined, page, size },
  });

  return response.data; // { content, totalElements, totalPages, last, ... }
}