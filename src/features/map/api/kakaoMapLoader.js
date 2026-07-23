let kakaoMapSdkPromise = null;

/**
 * 카카오 지도 SDK를 필요한 순간에 한 번만 불러옵니다.
 * React 개발 모드는 화면을 두 번 확인할 수 있어, Promise를 저장해 중복 로딩을 막습니다.
 */
export function loadKakaoMapSdk(appKey) {
  if (window.kakao?.maps?.services) {
    return Promise.resolve(window.kakao);
  }

  if (!appKey) {
    return Promise.reject(
      new Error('VITE_KAKAO_MAP_JAVASCRIPT_KEY가 설정되지 않았습니다.'),
    );
  }

  if (kakaoMapSdkPromise) {
    return kakaoMapSdkPromise;
  }

  kakaoMapSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('kakao-map-sdk');
    const script = existingScript ?? document.createElement('script');

    const handleLoad = () => {
      if (!window.kakao?.maps) {
        kakaoMapSdkPromise = null;
        reject(new Error('카카오 지도 객체를 찾지 못했습니다.'));
        return;
      }

      window.kakao.maps.load(() => resolve(window.kakao));
    };

    const handleError = () => {
      kakaoMapSdkPromise = null;
      reject(new Error('카카오 지도 SDK를 불러오지 못했습니다.'));
    };

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });

    if (!existingScript) {
      script.id = 'kakao-map-sdk';
      script.async = true;
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
      document.head.appendChild(script);
    }
  });

  return kakaoMapSdkPromise;
}
