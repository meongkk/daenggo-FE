import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNavigation from '../../../components/navigation/BottomNavigation';
import AppIcon from '../../../components/ui/AppIcon';
import { getApiErrorMessage } from '../../../lib/apiError';
import { logout } from '../../auth/api/authApi';
import {
  clearTokens,
  getStoredTokens,
} from '../../auth/api/tokenStorage';
import {
  getMyInfo,
  withdrawMyAccount,
} from '../../user/api/userApi';
import ProfileAvatar from '../components/ProfileAvatar';
import './MyPage.css';

const menuItems = [
  { label: '내 정보 수정', path: '/mypage/edit' },
  { label: '찜 목록 관리', path: '/mypage/favorites' },
  { label: '내 반려동물 관리', path: '/mypage/pets' },
  { label: '그룹 관리', path: '/mypage/groups' },
];

export default function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [accountDialog, setAccountDialog] = useState(null);
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileRequestKey, setProfileRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        setIsProfileLoading(true);
        setProfileError('');
        const myInfo = await getMyInfo({ signal: controller.signal });
        setProfile(myInfo);
      } catch (error) {
        if (error.code === 'ERR_CANCELED') {
          return;
        }

        if (error.response?.status === 401) {
          clearTokens();
          navigate('/login', { replace: true });
          return;
        }

        setProfileError('사용자 정보를 불러오지 못했습니다.');
      } finally {
        if (!controller.signal.aborted) {
          setIsProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => controller.abort();
  }, [navigate, profileRequestKey]);

  const handleLogout = async () => {
    try {
      setIsAccountSubmitting(true);
      const refreshToken = getStoredTokens()?.refreshToken;
      if (refreshToken) {
        await logout(refreshToken);
      }
    } finally {
      clearTokens();
      navigate('/login', { replace: true });
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsAccountSubmitting(true);
      await withdrawMyAccount();
      clearTokens();
      navigate('/login', {
        replace: true,
        state: { message: '회원 탈퇴가 완료되었습니다.' },
      });
    } catch (error) {
      setAccountDialog(null);
      setProfileError(getApiErrorMessage(error, '회원 탈퇴를 처리하지 못했습니다.'));
      setIsAccountSubmitting(false);
    }
  };

  return (
    <div className="mobile-screen mypage-screen">
      <main className="mypage-main">
        <h1 className="mypage-title">마이페이지</h1>
        {location.state?.message && <p className="mypage-notice">{location.state.message}</p>}
        <section className="profile-summary" aria-label="프로필">
          <ProfileAvatar
            editable
            imageUrl={profile?.profileImageUrl}
            nickname={profile?.nickname}
          />
          <strong>{isProfileLoading ? '불러오는 중...' : profile?.nickname || '-'}</strong>
          <span>{profile?.email || ''}</span>
          {profileError && (
            <div className="profile-summary__error" role="alert">
              <p>{profileError}</p>
              <button type="button" onClick={() => setProfileRequestKey((key) => key + 1)}>
                다시 시도
              </button>
            </div>
          )}
        </section>

        <nav className="mypage-menu" aria-label="마이페이지 메뉴">
          {menuItems.map((item) => (
            <button key={item.path} type="button" onClick={() => navigate(item.path)}>
              <span>{item.label}</span>
              <AppIcon name="chevron" size={19} />
            </button>
          ))}
        </nav>

        <div className="mypage-account-actions">
          <button type="button" onClick={() => setAccountDialog('logout')}><AppIcon name="logout" size={17} /> 로그아웃</button>
          <button type="button" className="mypage-withdraw" onClick={() => setAccountDialog('withdraw')}>회원 탈퇴</button>
        </div>
      </main>
      <BottomNavigation active="mypage" />

      {accountDialog && (
        <div className="logout-overlay" role="presentation" onMouseDown={() => !isAccountSubmitting && setAccountDialog(null)}>
          <section className="logout-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="logout-title">{accountDialog === 'logout' ? '로그아웃' : '회원 탈퇴'}</h2>
            <p>
              {accountDialog === 'logout'
                ? <>정말 로그아웃하시겠어요?<br />다시 이용하려면 로그인이 필요합니다.</>
                : <>탈퇴하면 계정을 다시 사용할 수 없습니다.<br />정말 탈퇴하시겠어요?</>}
            </p>
            <div>
              <button type="button" className="logout-cancel" onClick={() => setAccountDialog(null)} disabled={isAccountSubmitting}>취소</button>
              <button
                type="button"
                className="logout-confirm"
                onClick={accountDialog === 'logout' ? handleLogout : handleWithdraw}
                disabled={isAccountSubmitting}
              >
                {isAccountSubmitting ? '처리 중...' : accountDialog === 'logout' ? '로그아웃' : '회원 탈퇴'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
