import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import BoardListPage from './features/board/pages/BoardListPage';
import BoardDetailPage from './features/board/pages/BoardDetailPage';
import BoardWritePage from './features/board/pages/BoardWritePage';
import LoginPage from './features/auth/pages/LoginPage';
import SignUpPage from './features/auth/pages/SignUpPage';
import RequireAuth from './features/auth/components/RequireAuth';
// 이메일 인증 API 연결 전까지 인증번호 화면은 잠시 비활성화합니다.
// import VerificationPage from './features/auth/pages/VerificationPage';
import MyPage from './features/mypage/pages/MyPage';
import ProfileEditPage from './features/mypage/pages/ProfileEditPage';
import FavoritesPage from './features/mypage/pages/FavoritesPage';
import PetsPage from './features/mypage/pages/PetsPage';
import FamilyPage from './features/mypage/pages/FamilyPage';
import PetFormPage from './features/pet/pages/PetFormPage';
import GroupListPage from './features/group/pages/GroupListPage';
import GroupFormPage from './features/group/pages/GroupFormPage';
import GroupDetailPage from './features/group/pages/GroupDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        {/* <Route path="/verify" element={<VerificationPage />} /> */}

        <Route element={<RequireAuth />}>
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/edit" element={<ProfileEditPage />} />
          <Route path="/mypage/favorites" element={<FavoritesPage />} />
          <Route path="/mypage/pets" element={<PetsPage />} />
          <Route path="/mypage/pets/new" element={<PetFormPage />} />
          <Route path="/mypage/pets/:petId/edit" element={<PetFormPage />} />
          <Route path="/mypage/family" element={<FamilyPage />} />
          <Route path="/mypage/groups" element={<GroupListPage />} />
          <Route path="/mypage/groups/new" element={<GroupFormPage />} />
          <Route path="/mypage/groups/:groupId" element={<GroupDetailPage />} />
          <Route path="/mypage/groups/:groupId/edit" element={<GroupFormPage />} />
          <Route path="/board" element={<BoardListPage />} />
          <Route path="/board/write" element={<BoardWritePage />} />
          <Route path="/board/:id" element={<BoardDetailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
