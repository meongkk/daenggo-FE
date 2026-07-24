import PlaceImage from './PlaceImage';

const CONDITION_LABELS = {
  ALLOWED: '가능',
  DENIED: '불가능',
  RESTRICTED: '조건부 가능',
  REQUIRED: '필수',
  NOT_REQUIRED: '필수 아님',
  UNKNOWN: '정보 없음',
  SMALL: '소형견',
  MEDIUM: '중형견',
  LARGE: '대형견',
  ALL: '크기 제한 없음',
};

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        className={filled ? 'is-filled' : ''}
        d="M20.8 4.9a5.5 5.5 0 0 0-7.8 0L12 6l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.3a5.5 5.5 0 0 0 1-8.8Z"
      />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5h5v5M19 5l-8 8" />
      <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function formatCondition(value) {
  if (!value) return null;
  return CONDITION_LABELS[value] ?? value;
}

/**
 * 지도 위 미리보기에서 "자세히보기"를 누르면 보여주는 전체 상세 화면입니다.
 * 백엔드가 현재 내려주는 값만 표시하며, 없는 값은 억지로 만들지 않습니다.
 */
function PlaceDetailPanel({
  place,
  isFavorite,
  kakaoMapUrl,
  onClose,
  onFavoriteToggle,
}) {
  const phoneNumber = place.phone?.replace(/[^\d+]/g, '');
  const condition = place.condition;
  const kakaoPlace = place.kakaoPlace;
  const kakaoReviewUrl = kakaoPlace?.placeUrl || kakaoMapUrl;
  const conditionItems = condition
    ? [
        ['실내 동반', formatCondition(condition.indoorStatus)],
        ['목줄 착용', formatCondition(condition.leashRequired)],
        ['입마개 착용', formatCondition(condition.muzzleRequired)],
        ['맹견 동반', formatCondition(condition.dangerousAllowed)],
        ['허용 크기', formatCondition(condition.allowedSize)],
        [
          '최대 체중',
          condition.maxWeight ? `${condition.maxWeight}kg` : null,
        ],
        ['편의시설', condition.amenities],
      ].filter(([, value]) => value)
    : [];

  return (
    <article className="map-place-detail" aria-label={`${place.name} 상세정보`}>
      <header className="map-detail-header">
        <div>
          <span>{place.categoryName}</span>
          <h1>{place.name}</h1>
        </div>
        <div className="map-detail-header-actions">
          <button
            className={`map-detail-favorite ${isFavorite ? 'active' : ''}`}
            type="button"
            onClick={onFavoriteToggle}
            aria-label={isFavorite ? '저장 취소' : '장소 저장'}
          >
            <HeartIcon filled={isFavorite} />
          </button>
          <button
            className="map-detail-close"
            type="button"
            onClick={onClose}
            aria-label="상세정보 닫기"
          >
            ×
          </button>
        </div>
      </header>

      <PlaceImage
        className="map-detail-hero"
        src={place.thumbnail}
        alt={`${place.name} 대표`}
      />

      <div className="map-detail-body">
        <section className="map-detail-section">
          <div className="map-detail-section-title">
            <h2>기본 정보</h2>
            <a href={kakaoMapUrl} target="_blank" rel="noreferrer">
              <ExternalLinkIcon />
              카카오맵에서 보기
            </a>
          </div>

          <dl className="map-detail-info-list">
            <div>
              <dt>주소</dt>
              <dd>{place.address || '등록된 주소가 없습니다.'}</dd>
            </div>
            <div>
              <dt>전화번호</dt>
              <dd>
                {phoneNumber ? (
                  <a href={`tel:${phoneNumber}`}>{place.phone} · 전화 걸기</a>
                ) : (
                  '등록된 전화번호가 없습니다.'
                )}
              </dd>
            </div>
            <div>
              <dt>운영시간</dt>
              <dd>{place.openTime || '등록된 운영시간이 없습니다.'}</dd>
            </div>
            <div>
              <dt>휴무일</dt>
              <dd>{place.restDate || '등록된 휴무일이 없습니다.'}</dd>
            </div>
            <div>
              <dt>주차</dt>
              <dd>{place.parking || '등록된 주차 정보가 없습니다.'}</dd>
            </div>
          </dl>
        </section>

        {kakaoPlace && (
          <section className="map-detail-section">
            <div className="map-detail-section-title">
              <h2>카카오 장소 정보</h2>
              <a href={kakaoPlace.placeUrl} target="_blank" rel="noreferrer">
                <ExternalLinkIcon />
                원본 보기
              </a>
            </div>

            <dl className="map-detail-info-list">
              <div>
                <dt>카카오 상호</dt>
                <dd>{kakaoPlace.placeName}</dd>
              </div>
              <div>
                <dt>카카오 분류</dt>
                <dd>
                  {kakaoPlace.categoryName ||
                    kakaoPlace.categoryGroupName ||
                    '분류 정보 없음'}
                  {kakaoPlace.categoryGroupCode &&
                    ` (${kakaoPlace.categoryGroupCode})`}
                </dd>
              </div>
              <div>
                <dt>도로명 주소</dt>
                <dd>{kakaoPlace.roadAddressName || '도로명 주소 정보 없음'}</dd>
              </div>
              <div>
                <dt>지번 주소</dt>
                <dd>{kakaoPlace.addressName || '지번 주소 정보 없음'}</dd>
              </div>
              <div>
                <dt>카카오 전화</dt>
                <dd>{kakaoPlace.phone || '전화번호 정보 없음'}</dd>
              </div>

            </dl>
          </section>
        )}

        <section className="map-detail-section">
          <div className="map-detail-section-title">
            <h2>반려동물 이용 조건</h2>
          </div>

          {conditionItems.length > 0 ? (
            <dl className="map-detail-condition-grid">
              {conditionItems.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="map-detail-empty">
              등록된 반려동물 이용 조건이 없습니다. 방문 전에 매장에 확인해 주세요.
            </p>
          )}

          {condition?.rawText && (
            <details className="map-detail-raw">
              <summary>관광데이터 원문 보기</summary>
              <p>{condition.rawText}</p>
            </details>
          )}
        </section>

        <section className="map-detail-section">
          <div className="map-detail-section-title">
            <h2>리뷰</h2>
          </div>
          <p className="map-detail-empty">
            카카오 지도 API는 리뷰 내용을 제공하지 않습니다. 최신 리뷰는 카카오맵에서
            확인해 주세요.
          </p>
          <a
            className="map-detail-kakao-button"
            href={kakaoReviewUrl}
            target="_blank"
            rel="noreferrer"
          >
            카카오맵에서 리뷰 보기
            <ExternalLinkIcon />
          </a>
        </section>
      </div>
    </article>
  );
}

export default PlaceDetailPanel;
