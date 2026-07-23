import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BoardListPage from './features/board/pages/BoardListPage';
import BoardDetailPage from './features/board/pages/BoardDetailPage';
import BoardWritePage from './features/board/pages/BoardWritePage';
import MapPage from './features/map/pages/MapPage';
import WalkCalendarPage from './features/walk/pages/WalkCalendarPage';
import WalkTrackingPage from './features/walk/pages/WalkTrackingPage';
import WalkDetailPage from './features/walk/pages/WalkDetailPage';
import WalkRouteMapPage from './features/walk/pages/WalkRouteMapPage';
import { useEffect } from 'react';

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;

function App() { //테스트용

  useEffect(() => {
    // 이미 로드되어 있으면 다시 로드하지 않음
    if (window.kakao && window.kakao.maps) return;

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.async = true;

    document.head.appendChild(script);
  }, []);

  
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/map" element={<MapPage />} />
          <Route path="/board" element={<BoardListPage />} />
          <Route path="/board/:id" element={<BoardDetailPage />} />
          <Route path="/board/write" element={<BoardWritePage />} />
          <Route path="/walk" element={<WalkCalendarPage />} />
          <Route path="/walk/tracking/:walkId" element={<WalkTrackingPage />}/>
          <Route path="/walk/:walkId" element={<WalkDetailPage />} />
          <Route path="/walk/:walkId/map" element={<WalkRouteMapPage />}/>
          {/* <Route path="/place" element={<PlacePage />} /> */}
        </Routes>
      </BrowserRouter>
  );
}

export default App;
//마지막 테스트
