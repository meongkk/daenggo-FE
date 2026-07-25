import { useMemo, useState } from 'react';
import { getNearbyPlaces, searchPlacesByKeyword } from '../api/placeApi';
import PlaceImage from './PlaceImage';
import './PlaceSearchPanel.css';

const RECENT_SEARCH_KEY = 'daenggo-place-recent-searches';

const CATEGORY_OPTIONS = [
  { label: '전체', value: '' },
  { label: '맛집·카페', value: 'RESTAURANT' },
  { label: '관광지', value: 'TOURIST' },
  { label: '숙소', value: 'LODGING' },
  { label: '문화시설', value: 'CULTURE' },
  { label: '축제·공연', value: 'FESTIVAL' },
  { label: '레포츠', value: 'LEISURE' },
  { label: '쇼핑', value: 'SHOPPING' },
  { label: '기타', value: 'ETC' },
];

const SIZE_OPTIONS = [
  { label: '소형견', value: 'SMALL' },
  { label: '중형견', value: 'MEDIUM' },
  { label: '대형견', value: 'LARGE' },
];

const DEFAULT_FILTERS = {
  category: '',
  indoorAllowedOnly: false,
  petWeight: '',
  petSize: '',
  isDangerous: false,
};

function readRecentSearches() {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_SEARCH_KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PlaceSearchPanel({
  bounds,
  initialQuery,
  initialFilters = DEFAULT_FILTERS,
  onClose,
  onFiltersApplied,
  onSelectPlace,
}) {
  const [view, setView] = useState('search');
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));
  const [sort, setSort] = useState('default');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'category' ? Boolean(value) : value !== '',
  ).length;

  const sortedResults = useMemo(() => {
    if (sort !== 'name') return results;
    return [...results].sort((a, b) =>
      (a.title ?? '').localeCompare(b.title ?? '', 'ko'),
    );
  }, [results, sort]);

  const saveRecentSearch = (keyword) => {
    const next = [keyword, ...recentSearches.filter((item) => item !== keyword)].slice(0, 5);
    setRecentSearches(next);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  };

  /** 검색어를 백엔드 GET /api/places/search로 보내 장소 이름을 찾습니다. */
  const handleKeywordSearch = async (event) => {
    event?.preventDefault();
    const keyword = query.trim();
    if (!keyword) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await searchPlacesByKeyword(keyword);
      setResults(response.content ?? []);
      setHasSearched(true);
      saveRecentSearch(keyword);
    } catch {
      setErrorMessage('검색 결과를 가져오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  /** 지도 범위와 선택 조건을 GET /api/places/nearby의 쿼리값으로 보냅니다. */
  const handleApplyFilters = async () => {
    if (!bounds) {
      setErrorMessage('지도를 불러온 뒤 다시 시도해 주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await getNearbyPlaces({ bounds, ...filters });
      const nearbyPlaces = Array.isArray(response) ? response : [];
      // 백엔드 nearby API에는 검색어 조건이 없어서, 받아온 현재 지도 결과에서 이름을 한 번 더 거릅니다.
      const keyword = query.trim().toLocaleLowerCase();
      const visiblePlaces = keyword
        ? nearbyPlaces.filter((place) => place.title?.toLocaleLowerCase().includes(keyword))
        : nearbyPlaces;

      setResults(visiblePlaces);
      setHasSearched(true);
      setView('search');
      // 부모 지도에도 같은 필터 결과를 전달해 마커와 목록이 서로 다르지 않게 합니다.
      onFiltersApplied?.({
        places: visiblePlaces,
        filters: { ...filters },
        keyword,
      });
    } catch {
      setErrorMessage('필터 결과를 가져오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeRecentSearch = (keyword) => {
    const next = recentSearches.filter((item) => item !== keyword);
    setRecentSearches(next);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  };

  if (view === 'filters') {
    return (
      <section className="place-search-panel" aria-label="장소 검색 필터">
        <header className="place-filter-header">
          <button type="button" onClick={() => setView('search')}>취소</button>
          <strong>필터</strong>
          <span />
        </header>

        <div className="place-filter-body">
          <fieldset>
            <legend>장소 종류</legend>
            <div className="place-filter-chips">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={filters.category === option.value ? 'active' : ''}
                  type="button"
                  onClick={() => setFilters((current) => ({
                    ...current,
                    category: option.value,
                  }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>반려동물 크기</legend>
            <div className="place-filter-chips">
              {SIZE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={filters.petSize === option.value ? 'active' : ''}
                  type="button"
                  onClick={() => setFilters((current) => ({
                    ...current,
                    petSize: current.petSize === option.value ? '' : option.value,
                  }))}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="place-weight-field">
            <span>반려동물 몸무게</span>
            <span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={filters.petWeight}
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  petWeight: event.target.value,
                }))}
                placeholder="0"
              />
              kg
            </span>
          </label>

          <label className="place-filter-switch">
            <span>
              <strong>실내 동반</strong>
              <small>실내 동반 가능한 장소만 보기</small>
            </span>
            <input
              type="checkbox"
              checked={filters.indoorAllowedOnly}
              onChange={(event) => setFilters((current) => ({
                ...current,
                indoorAllowedOnly: event.target.checked,
              }))}
            />
          </label>

          <label className="place-filter-switch">
            <span>
              <strong>맹견 동반</strong>
              <small>맹견 출입이 거절되지 않는 장소만 보기</small>
            </span>
            <input
              type="checkbox"
              checked={filters.isDangerous}
              onChange={(event) => setFilters((current) => ({
                ...current,
                isDangerous: event.target.checked,
              }))}
            />
          </label>

          {errorMessage && <p className="place-search-error">{errorMessage}</p>}
        </div>

        <button
          className="place-filter-apply"
          type="button"
          onClick={handleApplyFilters}
          disabled={isLoading}
        >
          {isLoading ? '찾는 중…' : '필터 적용하기'}
        </button>
      </section>
    );
  }

  return (
    <section className="place-search-panel" aria-label="장소 검색">
      <header className="place-search-header">
        <button className="place-search-back" type="button" onClick={onClose} aria-label="검색 닫기">
          ‹
        </button>
        <form onSubmit={handleKeywordSearch}>
          <SearchIcon />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="장소 이름 검색"
          />
          {query && (
              <button
                  className="place-search-clear"
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="검색어 지우기"
              >
                ×
              </button>
          )}
        </form>
      </header>

      {!hasSearched ? (
        <div className="place-recent-searches">
          <strong>최근 검색</strong>
          {recentSearches.length === 0 ? (
            <p>최근 검색어가 없어요.</p>
          ) : (
            recentSearches.map((keyword) => (
              <div key={keyword}>
                <button type="button" onClick={() => setQuery(keyword)}>{keyword}</button>
                <button type="button" onClick={() => removeRecentSearch(keyword)} aria-label={`${keyword} 삭제`}>×</button>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="place-search-tools">
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="검색 결과 정렬">
              <option value="default">기본순</option>
              <option value="name">이름순</option>
            </select>
            <button type="button" onClick={() => setView('filters')}>
              ☷ 필터
              {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
            </button>
          </div>

          <div className="place-search-results">
            {isLoading && <p>장소를 찾고 있어요…</p>}
            {!isLoading && errorMessage && <p className="place-search-error">{errorMessage}</p>}
            {!isLoading && !errorMessage && sortedResults.length === 0 && (
              <p>조건에 맞는 장소가 없어요.</p>
            )}
            {!isLoading && sortedResults.map((place) => (
              <button
                className="place-search-result-card"
                key={place.placeId}
                type="button"
                onClick={() => onSelectPlace(place)}
              >
                <PlaceImage
                  src={place.thumbnail}
                  alt={`${place.title} 대표`}
                  className="place-search-result-image"
                />
                <span>
                  <strong>{place.title}</strong>
                  <small>{CATEGORY_OPTIONS.find((item) => item.value === place.category)?.label ?? '반려동물 동반 장소'}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default PlaceSearchPanel;
