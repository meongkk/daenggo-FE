import { useEffect, useState } from 'react';

/**
 * 장소 이미지가 없거나 주소가 깨졌을 때 빈 이미지 아이콘으로 대체합니다.
 * onError는 브라우저가 실제 이미지 로딩에 실패했을 때 실행되는 이벤트입니다.
 */
function PlaceImage({ src, alt, className = '' }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={`map-place-image-placeholder ${className}`}
        role="img"
        aria-label={`${alt} 이미지 없음`}
      >
        <span aria-hidden="true">▧</span>
        <small>등록된 사진이 없어요</small>
      </div>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
    />
  );
}

export default PlaceImage;
