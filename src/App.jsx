import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BoardListPage from './features/board/pages/BoardListPage';
import BoardDetailPage from './features/board/pages/BoardDetailPage';
import BoardWritePage from './features/board/pages/BoardWritePage';
import WalkCalendarPage from './features/walk/pages/WalkCalendarPage';
import WalkTrackingPage from './features/walk/pages/WalkTrackingPage';
import WalkDetailPage from './features/walk/pages/WalkDetailPage';

function App() { //테스트용
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/board" element={<BoardListPage />} />
          <Route path="/board/:id" element={<BoardDetailPage />} />
          <Route path="/board/write" element={<BoardWritePage />} />
          <Route path="/walk" element={<WalkCalendarPage />} />
          <Route path="/walk/track" element={<WalkTrackingPage />} />
          <Route path="/walk/:walkId" element={<WalkDetailPage />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
