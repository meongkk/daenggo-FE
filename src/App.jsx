import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BoardListPage from './features/board/pages/BoardListPage';
import BoardDetailPage from './features/board/pages/BoardDetailPage';
import BoardWritePage from './features/board/pages/BoardWritePage';

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/board" element={<BoardListPage />} />
          <Route path="/board/:id" element={<BoardDetailPage />} />
          <Route path="/board/write" element={<BoardWritePage />} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;