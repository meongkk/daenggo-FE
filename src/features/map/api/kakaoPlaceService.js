function normalizeName(name) {
  return name.replace(/\s+/g, '').toLocaleLowerCase();
}

/**
 * 카카오 지도 JavaScript SDK의 장소 검색 결과에서 같은 상호를 찾습니다.
 * 백엔드 저장 장소와 이름이 맞을 때만 사용해 다른 가게 정보가 섞이는 것을 막습니다.
 */
export function findKakaoPlace(kakao, place) {
  if (!kakao?.maps?.services?.Places || !place?.name) {
    return Promise.resolve(null);
  }

  const service = new kakao.maps.services.Places();
  const location = new kakao.maps.LatLng(place.latitude, place.longitude);

  return new Promise((resolve) => {
    service.keywordSearch(
      place.name,
      (results, status) => {
        if (status !== kakao.maps.services.Status.OK || !Array.isArray(results)) {
          resolve(null);
          return;
        }

        const targetName = normalizeName(place.name);
        const matchedPlace = results.find((result) => {
          const kakaoName = normalizeName(result.place_name ?? '');
          return (
            kakaoName === targetName ||
            kakaoName.includes(targetName) ||
            targetName.includes(kakaoName)
          );
        });

        if (!matchedPlace) {
          resolve(null);
          return;
        }

        resolve({
          id: matchedPlace.id,
          placeName: matchedPlace.place_name,
          categoryName: matchedPlace.category_name,
          categoryGroupCode: matchedPlace.category_group_code,
          categoryGroupName: matchedPlace.category_group_name,
          phone: matchedPlace.phone,
          addressName: matchedPlace.address_name,
          roadAddressName: matchedPlace.road_address_name,
          placeUrl: matchedPlace.place_url,
          distance: matchedPlace.distance,
          latitude: matchedPlace.y,
          longitude: matchedPlace.x,
        });
      },
      {
        location,
        radius: 1000,
        size: 15,
        sort: kakao.maps.services.SortBy.DISTANCE,
      },
    );
  });
}
