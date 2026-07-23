import PlaceImage from './PlaceImage';

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3a5.5 5.5 0 0 0 1-8.8Z" />
    </svg>
  );
}

/**
 * 오른쪽 위 하트를 눌렀을 때 브라우저에 저장된 찜 장소를 모두 보여줍니다.
 * 지도 위치는 바꾸지 않으므로 목록을 여는 것만으로 장소 API가 다시 호출되지 않습니다.
 */
function FavoritePlacesPanel({ places, onClose, onSelect, onRemove }) {
  return (
    <article className="map-favorites-panel" aria-label="찜한 장소 목록">
      <header className="map-favorites-header">
        <div>
          <span>MY PLACE</span>
          <h1>찜한 장소</h1>
          <p>{places.length}곳을 저장했어요</p>
        </div>
        <button type="button" onClick={onClose} aria-label="찜 목록 닫기">
          ×
        </button>
      </header>

      {places.length === 0 ? (
        <div className="map-favorites-empty">
          <span aria-hidden="true">♡</span>
          <strong>아직 찜한 장소가 없어요</strong>
          <p>지도에서 마음에 드는 장소의 하트를 눌러 저장해 보세요.</p>
          <button type="button" onClick={onClose}>
            지도로 돌아가기
          </button>
        </div>
      ) : (
        <ul className="map-favorites-list">
          {places.map((place) => (
            <li key={place.id}>
              <button
                className="map-favorite-place-main"
                type="button"
                onClick={() => onSelect(place)}
                aria-label={`${place.name} 지도에서 보기`}
              >
                <PlaceImage
                  className="map-favorite-place-image"
                  src={place.thumbnail}
                  alt={`${place.name} 대표`}
                />
                <span className="map-favorite-place-content">
                  <small>{place.categoryName || '반려동물 동반 장소'}</small>
                  <strong>{place.name}</strong>
                  <span>{place.address || '주소 정보가 없습니다.'}</span>
                  <em>지도에서 보기 →</em>
                </span>
              </button>

              <button
                className="map-favorite-place-remove"
                type="button"
                onClick={() => onRemove(place)}
                aria-label={`${place.name} 찜 삭제`}
              >
                <HeartIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default FavoritePlacesPanel;
