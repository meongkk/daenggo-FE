import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BottomNavigation from '../../../components/BottomNavigation';
import { loadKakaoMapSdk } from '../api/kakaoMapLoader';
import { findKakaoPlace } from '../api/kakaoPlaceService';
import {
  getNearbyPlaces,
  getNearbyPlacesForPet,
  getPlaceDetail,
} from '../api/placeApi';
import FavoritePlacesPanel from '../components/FavoritePlacesPanel';
import PlaceDetailPanel from '../components/PlaceDetailPanel';
import PlaceImage from '../components/PlaceImage';
import PlaceSearchPanel from '../components/PlaceSearchPanel';
import './Map.css';


const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY;
const FAVORITES_STORAGE_KEY = 'daenggo-backend-place-favorites';
const DEFAULT_CENTER = { latitude: 37.5665, longitude: 126.978 };
const EMPTY_PLACE_FILTERS = {
  category: '',
  petId: '',
  indoorAllowedOnly: false,
  petWeight: '',
  petSize: '',
  isDangerous: false,
};

// 백엔드 Place.category에 실제로 저장되는 값과 정확히 맞춥니다.
const PLACE_CATEGORIES = [
  { id: 'all', label: '전체 장소', icon: '🐾', value: null },
  { id: 'restaurant', label: '맛집·카페', icon: '🍴', value: 'RESTAURANT' },
  { id: 'tourist', label: '관광지', icon: '🌲', value: 'TOURIST' },
  { id: 'stay', label: '숙소', icon: '🏠', value: 'LODGING' },
];

const CATEGORY_LABELS = {
  RESTAURANT: '맛집·카페',
  TOURIST: '관광지',
  CULTURE: '문화시설',
  FESTIVAL: '축제·공연',
  LEISURE: '레포츠',
  LODGING: '숙소',
  SHOPPING: '쇼핑',
  ETC: '기타 장소',
};

function readFavoritePlaces() {
  try {
    const savedPlaces = JSON.parse(
      localStorage.getItem(FAVORITES_STORAGE_KEY) ?? '[]',
    );
    return Array.isArray(savedPlaces) ? savedPlaces : [];
  } catch {
    return [];
  }
}

/** 백엔드 목록 응답을 지도에서 공통으로 사용할 모양으로 바꿉니다. */
function normalizeNearbyPlace(place) {
  return {
    id: String(place.placeId),
    name: place.title,
    categoryName: CATEGORY_LABELS[place.category] ?? '반려동물 동반 장소',
    categoryCode: place.category,
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    thumbnail: place.thumbnail,
    address: '',
    phone: '',
    condition: null,
  };
}

/** 목록 정보에 백엔드 상세정보와 카카오 장소 검색 결과를 합칩니다. */
function normalizePlaceDetail(detail, summary, kakaoPlace) {
  return {
    ...summary,
    id: String(detail.placeId),
    name: detail.title,
    categoryName: CATEGORY_LABELS[detail.category] ?? '반려동물 동반 장소',
    categoryCode: detail.category,
    latitude: Number(detail.latitude),
    longitude: Number(detail.longitude),
    thumbnail: detail.thumbnail,
    address:
      detail.address ||
      kakaoPlace?.roadAddressName ||
      kakaoPlace?.addressName,
    phone: detail.tel || kakaoPlace?.phone,
    openTime: detail.openTime,
    restDate: detail.restDate,
    parking: detail.parking,
    condition: detail.condition,
    kakaoPlace,
    isDetailLoading: false,
  };
}

function getKakaoMapLink(place) {
  const name = encodeURIComponent(place.name);
  return `https://map.kakao.com/link/map/${name},${place.latitude},${place.longitude}`;
}

/** 현재 위치를 빨간색 원과 흰색 테두리로 표시합니다. */
function createCurrentLocationMarkerImage(kakao) {
  const markerSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="10" fill="#FF3B30" stroke="white" stroke-width="4"/>
    </svg>`;
  const imageUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`;

  return new kakao.maps.MarkerImage(
    imageUrl,
    new kakao.maps.Size(28, 28),
    { offset: new kakao.maps.Point(14, 14) },
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        className={filled ? 'is-filled' : ''}
        d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3a5.5 5.5 0 0 0 1-8.8Z"
      />
    </svg>
  );
}

function MapPage() {
  const [searchParams] = useSearchParams();
  // useRef는 React 화면 밖의 카카오 지도 객체와 현재 필터 값을 기억합니다.
  const mapElementRef = useRef(null);
  const kakaoRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const currentLocationMarkerRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const activeCategoryValueRef = useRef('ALL');
  const activeKeywordRef = useRef('');
  // 필터 창을 닫아도 지도 이동 뒤 같은 조건으로 다시 조회하기 위해 Ref에 저장합니다.
  const placeFiltersRef = useRef(EMPTY_PLACE_FILTERS);
  // 사용자가 검색·카테고리·현재 위치 버튼을 누르기 전에는 장소 API를 호출하지 않습니다.
  const hasRequestedPlacesRef = useRef(false);

  // useState 값이 바뀌면 React가 지도 위 버튼과 장소 카드를 다시 그립니다.
  const [sdkState, setSdkState] = useState('loading');
  const [mapError, setMapError] = useState('');
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isPlaceDetailOpen, setIsPlaceDetailOpen] = useState(false);
  // 처음에는 어떤 카테고리도 선택하지 않아 주황색 활성 버튼이 없습니다.
  const [activeCategory, setActiveCategory] = useState(null);
  const [favoritePlaces, setFavoritePlaces] = useState(readFavoritePlaces);
  // /map?panel=favorites 주소로 들어오면 지도 위에 찜 목록을 바로 엽니다.
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(
    () => searchParams.get('panel') === 'favorites',
  );
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [searchPanelInitialView, setSearchPanelInitialView] = useState('search');
  const [placeFilters, setPlaceFilters] = useState(EMPTY_PLACE_FILTERS);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [notice, setNotice] = useState('장소 종류를 누르거나 검색하면 주변 장소를 보여드려요.');
  const activeMapFilterCount = Object.entries(placeFilters).filter(
    ([key, value]) => key !== 'category' ? Boolean(value) : value !== '',
  ).length;

  /** 카카오 지도의 현재 경계를 백엔드가 요구하는 네 좌표로 바꿉니다. */
  const readMapBounds = useCallback(() => {
    const bounds = mapRef.current?.getBounds();
    if (!bounds) return null;

    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    return {
      swLat: southWest.getLat(),
      swLng: southWest.getLng(),
      neLat: northEast.getLat(),
      neLng: northEast.getLng(),
    };
  }, []);

  /** 현재 지도 범위와 필터를 백엔드에 보내 DB 장소를 가져옵니다. */
const loadPlacesFromBackend = useCallback(async () => {
    const bounds = readMapBounds();
    if (!bounds) return;

    const requestId = ++requestSequenceRef.current;
    setIsSearching(true);
    setNotice('');

    try {
      const appliedFilters = placeFiltersRef.current;
      const category = appliedFilters.category || activeCategoryValueRef.current;
      const responsePlaces = appliedFilters.petId
        ? await getNearbyPlacesForPet({
            bounds,
            petId: appliedFilters.petId,
            category,
            indoorAllowedOnly: appliedFilters.indoorAllowedOnly,
          })
        : await getNearbyPlaces({
            bounds,
            category,
            indoorAllowedOnly: appliedFilters.indoorAllowedOnly,
            petWeight: appliedFilters.petWeight,
            petSize: appliedFilters.petSize,
            isDangerous: appliedFilters.isDangerous,
          });

      if (requestId !== requestSequenceRef.current) return;

      const normalizedPlaces = (Array.isArray(responsePlaces) ? responsePlaces : [])
        .map(normalizeNearbyPlace)
        .filter(
          (place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude),
        )
        .filter((place) => {
          const keyword = activeKeywordRef.current.trim().toLocaleLowerCase();
          return !keyword || place.name?.toLocaleLowerCase().includes(keyword);
        });

      // 백엔드가 필터링해서 보내준 결과를 지도 마커용 State에 저장합니다.
      setPlaces(normalizedPlaces);
      setSelectedPlace((current) =>
        current && normalizedPlaces.some((place) => place.id === current.id)
          ? current
          : null,
      );
      setNotice(
        normalizedPlaces.length > 0
          ? `반려동물 동반 장소 ${normalizedPlaces.length}곳을 찾았어요.`
          : '현재 지도 범위에 조건에 맞는 장소가 없어요.',
      );
    } catch (error) {
      if (requestId !== requestSequenceRef.current) return;

      const status = error.response?.status;
      let message = '장소 조회 중 오류가 발생했어요.';
      if (status === 404) {
        message = 'Place API를 찾지 못했어요. 실행 중인 백엔드를 확인해 주세요.';
      } else if (status === 502 || status === 503 || error.code === 'ERR_NETWORK') {
        message = '백엔드 서버가 실행 중이 아니에요. 서버를 켠 뒤 다시 시도해 주세요.';
      }
      setPlaces([]);
      setNotice(message);
    } finally {
      if (requestId === requestSequenceRef.current) {
        setIsSearching(false);
      }
    }
}, [readMapBounds]);

  // 화면이 처음 열릴 때 카카오 지도 객체를 만들고, 지도 이동이 끝날 때 DB를 다시 조회합니다.
  useEffect(() => {
    let disposed = false;
    let initializedMap = null;
    let idleHandler = null;

    loadKakaoMapSdk(KAKAO_APP_KEY)
      .then((kakao) => {
        if (disposed || !mapElementRef.current) return;

        kakaoRef.current = kakao;
        initializedMap = new kakao.maps.Map(mapElementRef.current, {
          center: new kakao.maps.LatLng(
            DEFAULT_CENTER.latitude,
            DEFAULT_CENTER.longitude,
          ),
          level: 7,
        });
        mapRef.current = initializedMap;
        setSdkState('ready');

        idleHandler = () => {
          if (hasRequestedPlacesRef.current) {
            loadPlacesFromBackend();
          }
        };
        kakao.maps.event.addListener(initializedMap, 'idle', idleHandler);
      })
      .catch((error) => {
        if (disposed) return;
        setSdkState('error');
        setMapError(error.message);
      });

    return () => {
      disposed = true;
      if (initializedMap && idleHandler && kakaoRef.current) {
        kakaoRef.current.maps.event.removeListener(
          initializedMap,
          'idle',
          idleHandler,
        );
      }
      markersRef.current.forEach((marker) => marker.setMap(null));
      currentLocationMarkerRef.current?.setMap(null);
    };
  }, [loadPlacesFromBackend]);

  // 즐겨찾기는 아직 로그인 사용자 API와 연결하지 않아 현재 브라우저에 저장합니다.
  useEffect(() => {
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favoritePlaces),
    );
  }, [favoritePlaces]);

  /** 지도 마커나 찜 목록에서 선택한 장소의 미리보기와 상세정보를 불러옵니다. */
  const openPlacePreview = useCallback(async (place, { fromFavorites = false } = {}) => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    if (fromFavorites) {
      // 다른 종류의 찜 장소도 조회 결과에 포함되도록 지도 필터를 함께 맞춥니다.
      const matchedCategory = PLACE_CATEGORIES.find(
        (category) => category.value === place.categoryCode,
      );
      activeCategoryValueRef.current = matchedCategory?.value ?? null;
      activeKeywordRef.current = '';
      setActiveCategory(matchedCategory?.id ?? 'all');
      setQuery('');
    }

    setIsFavoritesOpen(false);
    setIsPlaceDetailOpen(false);
    setSelectedPlace({ ...place, isDetailLoading: true });
    map.panTo(new kakao.maps.LatLng(place.latitude, place.longitude));

    try {
      // 백엔드 상세정보와 카카오 장소정보는 서로 독립적이므로 동시에 요청합니다.
      const [detail, kakaoPlace] = await Promise.all([
        getPlaceDetail(place.id),
        findKakaoPlace(kakao, place),
      ]);
      setSelectedPlace((current) =>
        current?.id === place.id
          ? normalizePlaceDetail(detail, place, kakaoPlace)
          : current,
      );
    } catch {
      setSelectedPlace((current) =>
        current?.id === place.id
          ? { ...place, isDetailLoading: false }
          : current,
      );
      setNotice('장소 상세정보를 가져오지 못했어요.');
    }
  }, []);

  // DB 조회 결과가 바뀌면 이전 마커를 지우고 새 마커를 지도에 표시합니다.
  useEffect(() => {
    const kakao = kakaoRef.current;
    const map = mapRef.current;
    if (!kakao || !map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));

    markersRef.current = places.map((place) => {
      const marker = new kakao.maps.Marker({
        map,
        position: new kakao.maps.LatLng(place.latitude, place.longitude),
        // image 옵션을 생략하면 카카오맵의 기본 핀 마커가 표시됩니다.
        title: place.name,
        clickable: true,
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        openPlacePreview(place);
      });
      return marker;
    });
  }, [openPlacePreview, places, sdkState]);

  const handleCategoryClick = (category) => {
    activeKeywordRef.current = '';
    // 이미 켜진 카테고리를 다시 누르면 조회를 중단하고 지도 마커를 모두 지웁니다.
    if (activeCategory === category.id) {
      requestSequenceRef.current += 1;
      hasRequestedPlacesRef.current = false;
      activeCategoryValueRef.current = 'ALL';
      activeKeywordRef.current = '';
      placeFiltersRef.current = EMPTY_PLACE_FILTERS;
      setPlaceFilters(EMPTY_PLACE_FILTERS);
      setActiveCategory(null);
      setQuery('');
      setPlaces([]);
      setSelectedPlace(null);
      setIsPlaceDetailOpen(false);
      setIsSearching(false);

      return;
    }

    hasRequestedPlacesRef.current = true;
    placeFiltersRef.current = EMPTY_PLACE_FILTERS;
    setPlaceFilters(EMPTY_PLACE_FILTERS);
    activeCategoryValueRef.current = category.value;
    activeKeywordRef.current = '';
    setQuery('');
    setActiveCategory(category.id);
    setIsPlaceDetailOpen(false);
    setSelectedPlace(null);
    loadPlacesFromBackend();
  };

  const handleFavoritesClick = () => {
    setIsPlaceDetailOpen(false);
    setIsFavoritesOpen(true);
  };

  /** 필터 창에서 받은 결과를 지도 마커에도 적용하고, 지도 이동 뒤에도 같은 필터를 유지합니다. */
  const handleFiltersApplied = ({ places: responsePlaces, filters, keyword }) => {
    const normalizedPlaces = responsePlaces
      .map(normalizeNearbyPlace)
      .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
    const matchedCategory = PLACE_CATEGORIES.find(
      (category) => category.value === filters.category,
    );

    // 이전 지도 이동 요청이 늦게 도착해 새 필터 결과를 덮어쓰지 못하게 합니다.
    requestSequenceRef.current += 1;
    placeFiltersRef.current = { ...filters };
    activeCategoryValueRef.current = filters.category || null;
    activeKeywordRef.current = keyword;
    hasRequestedPlacesRef.current = true;
    setPlaceFilters({ ...filters });
    setActiveCategory(matchedCategory?.id ?? null);
    setPlaces(normalizedPlaces);
    setSelectedPlace(null);
    setIsPlaceDetailOpen(false);
    setNotice(
      normalizedPlaces.length > 0
        ? `선택한 조건의 장소 ${normalizedPlaces.length}곳을 찾았어요.`
        : '현재 지도 범위에 조건에 맞는 장소가 없어요.',
    );
  };

  /** 검색 결과를 누르면 해당 장소를 지도에 표시하고 미리보기를 엽니다. */
  const handleSearchPlaceSelect = (rawPlace) => {
    const place = normalizeNearbyPlace(rawPlace);
    if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return;

    hasRequestedPlacesRef.current = true;
    activeKeywordRef.current = '';
    placeFiltersRef.current = EMPTY_PLACE_FILTERS;
    setPlaceFilters(EMPTY_PLACE_FILTERS);
    activeCategoryValueRef.current = place.categoryCode ?? null;
    const matchedCategory = PLACE_CATEGORIES.find(
      (category) => category.value === place.categoryCode,
    );

    setQuery(place.name);
    setPlaces([place]);
    setActiveCategory(matchedCategory?.id ?? null);
    setIsSearchPanelOpen(false);
    openPlacePreview(place);
  };

  const handleFavoriteToggle = (place) => {
    const alreadySaved = favoritePlaces.some((item) => item.id === place.id);
    setFavoritePlaces((current) =>
      alreadySaved
        ? current.filter((item) => item.id !== place.id)
        : [...current, place],
    );
    setNotice(
      alreadySaved ? '저장한 장소에서 삭제했어요.' : '장소를 저장했어요.',
    );
  };

  const handleCurrentLocation = () => {
    activeKeywordRef.current = '';
    if (!navigator.geolocation) {
      setNotice('이 브라우저는 현재 위치 기능을 지원하지 않아요.');
      return;
    }

    setIsLocating(true);
    hasRequestedPlacesRef.current = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const kakao = kakaoRef.current;
        const map = mapRef.current;
        const position = new kakao.maps.LatLng(coords.latitude, coords.longitude);

        map.panTo(position);
        currentLocationMarkerRef.current?.setMap(null);
        currentLocationMarkerRef.current = new kakao.maps.Marker({
          map,
          position,
          image: createCurrentLocationMarkerImage(kakao),
          title: '내 위치',
        });
        setIsLocating(false);
        setNotice('현재 위치로 이동했어요. 지도가 멈추면 주변 장소를 조회합니다.');
      },
      () => {
        setIsLocating(false);
        setNotice('위치 권한을 허용해야 현재 위치를 사용할 수 있어요.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const handleCustomizedPlaces = () => {
    const restaurantCategory = PLACE_CATEGORIES.find(
      (category) => category.id === 'restaurant',
    );
    handleCategoryClick(restaurantCategory);
  };

  const isSelectedFavorite = selectedPlace
    ? favoritePlaces.some((place) => place.id === selectedPlace.id)
    : false;

  const handlePlacePreviewClose = () => {
    setIsPlaceDetailOpen(false);
    setSelectedPlace(null);
  };

  return (
    <main className="map-page">
      <section className="map-shell" aria-label="반려동물 동반 장소 지도">
        <div ref={mapElementRef} className="kakao-map-canvas" />

        <div className="map-top-controls">
          <div className="map-search-bar">
            <button
              className="map-search-submit"
              type="button"
              onClick={() => {
                setSearchPanelInitialView('search');
                setIsSearchPanelOpen(true);
              }}
              aria-label="장소 검색 화면 열기"
              disabled={sdkState !== 'ready'}
            >
              <SearchIcon />
            </button>
            <input
              type="search"
              value={query}
              readOnly
              onClick={() => {
                setSearchPanelInitialView('search');
                setIsSearchPanelOpen(true);
              }}
              onFocus={() => {
                setSearchPanelInitialView('search');
                setIsSearchPanelOpen(true);
              }}
              placeholder="등록된 반려동물 동반 장소 검색"
              aria-label="장소 검색어"
            />
            <button
              className="map-favorite-filter"
              type="button"
              onClick={handleFavoritesClick}
              aria-label="찜한 장소 목록 열기"
            >
              <HeartIcon filled={favoritePlaces.length > 0} />
            </button>
          </div>

          <div className="map-category-list" aria-label="장소 종류 선택">
            {/* 필터 버튼은 가로 목록 맨 앞에 두어 작은 모바일 화면에서도 바로 보이게 합니다. */}
            <button
              className={`map-category-chip map-filter-chip ${activeMapFilterCount > 0 ? 'active' : ''}`}
              type="button"
              onClick={() => {
                setSearchPanelInitialView('filters');
                setIsSearchPanelOpen(true);
              }}
              disabled={sdkState !== 'ready'}
            >
              <span aria-hidden="true">☷</span>
              필터
              {activeMapFilterCount > 0 && (
                <b className="map-filter-count">{activeMapFilterCount}</b>
              )}
            </button>
            {PLACE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                className={`map-category-chip ${activeCategory === category.id ? 'active' : ''}`}
                type="button"
                onClick={() => handleCategoryClick(category)}
                disabled={sdkState !== 'ready'}
              >
                <span aria-hidden="true">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>

          {(notice || isSearching) && sdkState === 'ready' && (
            <p className="map-notice" role="status">
              {isSearching ? 'DB에서 장소를 찾고 있어요…' : notice}
            </p>
          )}
        </div>

        {sdkState !== 'ready' && (
          <div className="map-loading-panel" role="status">
            {sdkState === 'loading' ? (
              <>
                <span className="map-loading-spinner" />
                <strong>지도를 불러오고 있어요</strong>
              </>
            ) : (
              <>
                <strong>카카오 지도 설정이 필요해요</strong>
                <p>{mapError}</p>
                <code>VITE_KAKAO_MAP_JAVASCRIPT_KEY=발급받은_키</code>
              </>
            )}
          </div>
        )}

        {sdkState === 'ready' && (
          <>
            <button
              className="map-current-location"
              type="button"
              onClick={handleCurrentLocation}
              disabled={isLocating}
              aria-label="현재 위치로 이동"
            >
              <span aria-hidden="true">⌖</span>
            </button>

            {/*{!selectedPlace && (*/}
            {/*  // <button*/}
            {/*  //   className="map-custom-place"*/}
            {/*  //   type="button"*/}
            {/*  //   onClick={handleCustomizedPlaces}*/}
            {/*  // >*/}
            {/*  //   <span aria-hidden="true">☷</span>*/}
            {/*  //   반려동물 맛집·카페*/}
            {/*  // </button>*/}
            {/*)}*/}
          </>
        )}

        {selectedPlace && (
          <article className="map-place-card">
            <button
              className="map-place-close"
              type="button"
              onClick={handlePlacePreviewClose}
              aria-label="장소 정보 닫기"
            >
              ×
            </button>

            <PlaceImage
              className="map-place-preview-image"
              src={selectedPlace.thumbnail}
              alt={`${selectedPlace.name} 대표`}
            />

            <div className="map-place-heading">
              <div>
                <span>{selectedPlace.categoryName}</span>
                <h2>{selectedPlace.name}</h2>
              </div>
              <button
                className={`map-place-favorite ${isSelectedFavorite ? 'active' : ''}`}
                type="button"
                onClick={() => handleFavoriteToggle(selectedPlace)}
                aria-label={isSelectedFavorite ? '저장 취소' : '장소 저장'}
              >
                <HeartIcon filled={isSelectedFavorite} />
              </button>
            </div>

            <strong className="map-pet-friendly-badge">반려동물 동반 장소</strong>
            {selectedPlace.isDetailLoading ? (
              <p>상세정보를 불러오고 있어요…</p>
            ) : (
              <>
                <p>{selectedPlace.address || '주소 정보가 없습니다.'}</p>
                {(selectedPlace.openTime || selectedPlace.parking) && (
                  <div className="map-place-preview-meta">
                    {selectedPlace.openTime && (
                      <span>운영 {selectedPlace.openTime}</span>
                    )}
                    {selectedPlace.parking && (
                      <span>주차 {selectedPlace.parking}</span>
                    )}
                  </div>
                )}
                {selectedPlace.condition?.rawText && (
                  <p className="map-place-condition">
                    {selectedPlace.condition.rawText}
                  </p>
                )}
              </>
            )}

            <div className="map-place-actions">
              {selectedPlace.phone && <span>{selectedPlace.phone}</span>}
              <a
                href={getKakaoMapLink(selectedPlace)}
                target="_blank"
                rel="noreferrer"
              >
                카카오맵에서 보기
              </a>
            </div>

            <button
              className="map-place-detail-button"
              type="button"
              onClick={() => setIsPlaceDetailOpen(true)}
              disabled={selectedPlace.isDetailLoading}
            >
              {selectedPlace.isDetailLoading ? '정보 불러오는 중…' : '자세히보기'}
            </button>
          </article>
        )}
      </section>

      <BottomNavigation />

      {isFavoritesOpen && (
        <FavoritePlacesPanel
          places={favoritePlaces}
          onClose={() => setIsFavoritesOpen(false)}
          onSelect={(place) => openPlacePreview(place, { fromFavorites: true })}
          onRemove={handleFavoriteToggle}
        />
      )}

      {isSearchPanelOpen && (
        <PlaceSearchPanel
          bounds={readMapBounds()}
          initialQuery={searchPanelInitialView === 'filters' ? '' : query}
          initialView={searchPanelInitialView}
          initialFilters={placeFilters}
          onClose={() => setIsSearchPanelOpen(false)}
          onFiltersApplied={handleFiltersApplied}
          onSelectPlace={handleSearchPlaceSelect}
        />
      )}

      {isPlaceDetailOpen && selectedPlace && (
        <PlaceDetailPanel
          place={selectedPlace}
          isFavorite={isSelectedFavorite}
          kakaoMapUrl={getKakaoMapLink(selectedPlace)}
          onClose={() => setIsPlaceDetailOpen(false)}
          onFavoriteToggle={() => handleFavoriteToggle(selectedPlace)}
        />
      )}
    </main>
  );
}

export default MapPage;
