import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../../../components/BottomNavigation';
import { getApiErrorMessage } from '../../../lib/apiError';
import { clearTokens } from '../../auth/api/tokenStorage';
import {
  changePassword,
  getMyInfo,
  updateMyInfo,
} from '../../user/api/userApi';
import PasswordField from '../../auth/components/PasswordField';
import MyPageHeader from '../components/MyPageHeader';
import './MyPage.css';

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    email: '',
    profileImageUrl: '',
    currentPassword: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getMyInfo({ signal: controller.signal })
      .then((profile) => {
        setProfileForm((current) => ({
          ...current,
          nickname: profile.nickname || '',
          email: profile.email || '',
          profileImageUrl: profile.profileImageUrl || '',
        }));
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') {
          setProfileMessage(getApiErrorMessage(error, '내 정보를 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const updateProfileField = (field) => (event) => {
    setProfileForm((current) => ({ ...current, [field]: event.target.value }));
    setProfileMessage('');
  };

  const updatePasswordField = (field) => (event) => {
    setPasswordForm((current) => ({ ...current, [field]: event.target.value }));
    setPasswordMessage('');
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!profileForm.nickname.trim() || !profileForm.currentPassword) {
      setProfileMessage('닉네임과 현재 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setIsProfileSubmitting(true);
      setProfileMessage('');
      await updateMyInfo({
        nickname: profileForm.nickname.trim(),
        profileImageUrl: profileForm.profileImageUrl.trim(),
        currentPassword: profileForm.currentPassword,
      });
      navigate('/mypage', {
        replace: true,
        state: { message: '내 정보가 수정되었습니다.' },
      });
    } catch (error) {
      setProfileMessage(
        error.response?.status === 409
          ? '이미 사용 중인 닉네임입니다.'
          : getApiErrorMessage(error, '내 정보를 수정하지 못했습니다.'),
      );
    } finally {
      setIsProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordMessage('현재 비밀번호와 새 비밀번호를 입력해주세요.');
      return;
    }
    if (passwordForm.newPassword.length < 8 || passwordForm.newPassword.length > 72) {
      setPasswordMessage('새 비밀번호는 8자 이상 72자 이하로 입력해주세요.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setIsPasswordSubmitting(true);
      setPasswordMessage('');
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      clearTokens();
      navigate('/login', {
        replace: true,
        state: { message: '비밀번호가 변경되었습니다. 다시 로그인해주세요.' },
      });
    } catch (error) {
      setPasswordMessage(getApiErrorMessage(error, '비밀번호를 변경하지 못했습니다.'));
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  return (
    <div className="mobile-screen mypage-screen mypage-subpage">
      <MyPageHeader title="내 정보 수정" />
      <main className="profile-edit-content">
        <form className="auth-form auth-signup-form profile-edit-section" onSubmit={handleProfileSubmit}>
          <h2>프로필 정보</h2>
          <label className="auth-field" htmlFor="edit-nickname">
            <span>닉네임</span>
            <input id="edit-nickname" value={profileForm.nickname} onChange={updateProfileField('nickname')} maxLength={50} disabled={isLoading || isProfileSubmitting} />
          </label>
          <label className="auth-field" htmlFor="edit-email">
            <span>이메일 주소</span>
            <input id="edit-email" type="email" value={profileForm.email} readOnly disabled />
          </label>
          <label className="auth-field" htmlFor="edit-profile-image">
            <span>프로필 이미지 URL</span>
            <input id="edit-profile-image" type="url" value={profileForm.profileImageUrl} onChange={updateProfileField('profileImageUrl')} maxLength={250} disabled={isLoading || isProfileSubmitting} placeholder="https://..." />
          </label>
          <PasswordField id="profile-current-password" label="현재 비밀번호" value={profileForm.currentPassword} onChange={updateProfileField('currentPassword')} placeholder="정보 수정을 위해 입력해주세요" disabled={isLoading || isProfileSubmitting} />
          {profileMessage && <p className="auth-error" role="alert">{profileMessage}</p>}
          <button className="auth-primary-button" type="submit" disabled={isLoading || isProfileSubmitting}>
            {isProfileSubmitting ? '수정 중...' : '프로필 수정'}
          </button>
        </form>

        <form className="auth-form auth-signup-form profile-edit-section" onSubmit={handlePasswordSubmit}>
          <h2>비밀번호 변경</h2>
          <PasswordField id="password-current" label="현재 비밀번호" value={passwordForm.currentPassword} onChange={updatePasswordField('currentPassword')} disabled={isPasswordSubmitting} />
          <PasswordField id="password-new" label="새 비밀번호" value={passwordForm.newPassword} onChange={updatePasswordField('newPassword')} placeholder="8자 이상 입력해주세요" disabled={isPasswordSubmitting} />
          <PasswordField id="password-confirm" value={passwordForm.confirmPassword} onChange={updatePasswordField('confirmPassword')} placeholder="새 비밀번호를 다시 입력해주세요" disabled={isPasswordSubmitting} />
          {passwordMessage && <p className="auth-error" role="alert">{passwordMessage}</p>}
          <button className="auth-primary-button" type="submit" disabled={isPasswordSubmitting}>
            {isPasswordSubmitting ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </main>
      <BottomNavigation />
    </div>
  );
}
