import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppIcon from '../../../components/ui/AppIcon';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
  checkEmail,
  checkNickname,
  signup,
} from '../api/authApi';
import PasswordField from '../components/PasswordField';
import './Auth.css';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileImageUrl: '',
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [availability, setAvailability] = useState({ email: null, nickname: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (field === 'email' || field === 'nickname') {
      setAvailability((current) => ({ ...current, [field]: null }));
    }
    setError('');
  };

  const verifyAvailability = async (field) => {
    const value = form[field].trim();
    if (!value) {
      return false;
    }

    try {
      const available = field === 'email'
        ? await checkEmail(value)
        : await checkNickname(value);
      setAvailability((current) => ({ ...current, [field]: available }));
      return available;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, '중복 여부를 확인하지 못했습니다.'));
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.nickname.trim() || !form.email.trim() || !form.password) {
      setError('닉네임, 이메일, 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (form.password.length < 8 || form.password.length > 72) {
      setError('비밀번호는 8자 이상 72자 이하로 입력해주세요.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!agreed) {
      setError('약관과 개인정보 처리방침에 동의해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const [isEmailAvailable, isNicknameAvailable] = await Promise.all([
        availability.email ?? verifyAvailability('email'),
        availability.nickname ?? verifyAvailability('nickname'),
      ]);

      if (!isEmailAvailable || !isNicknameAvailable) {
        setError('이미 사용 중인 이메일 또는 닉네임이 있습니다.');
        return;
      }

      await signup({
        email: form.email.trim(),
        password: form.password,
        nickname: form.nickname.trim(),
        profileImageUrl: form.profileImageUrl.trim() || null,
      });

      navigate('/login', {
        replace: true,
        state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' },
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, '회원가입하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-screen auth-screen auth-detail-screen">
      <button className="screen-back-button" type="button" onClick={() => navigate(-1)} aria-label="뒤로 가기">
        <AppIcon name="back" />
      </button>
      <main className="auth-detail-content">
        <h1>회원가입</h1>
        <p className="auth-subtitle">댕고와 함께 산책을 시작해보세요</p>

        <form className="auth-form auth-signup-form" onSubmit={handleSubmit}>
          <label className="auth-field" htmlFor="nickname">
            <span>닉네임</span>
            <input
              id="nickname"
              value={form.nickname}
              onChange={updateField('nickname')}
              onBlur={() => verifyAvailability('nickname')}
              placeholder="닉네임을 입력해주세요"
              maxLength={50}
              disabled={isSubmitting}
            />
            {availability.nickname !== null && (
              <small className={availability.nickname ? 'auth-check--success' : 'auth-check--error'}>
                {availability.nickname ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.'}
              </small>
            )}
          </label>
          <label className="auth-field" htmlFor="signup-email">
            <span>이메일 주소</span>
            <input
              id="signup-email"
              type="email"
              value={form.email}
              onChange={updateField('email')}
              onBlur={() => verifyAvailability('email')}
              placeholder="name@email.com"
              autoComplete="email"
              maxLength={100}
              disabled={isSubmitting}
            />
            {availability.email !== null && (
              <small className={availability.email ? 'auth-check--success' : 'auth-check--error'}>
                {availability.email ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.'}
              </small>
            )}
          </label>
          <PasswordField id="new-password" label="비밀번호" value={form.password} onChange={updateField('password')} placeholder="8자 이상 입력해주세요" disabled={isSubmitting} />
          <PasswordField id="confirm-password" value={form.confirmPassword} onChange={updateField('confirmPassword')} placeholder="비밀번호를 다시 입력해주세요" disabled={isSubmitting} />
          <label className="auth-field" htmlFor="signup-profile-image">
            <span>프로필 이미지 URL <small>(선택)</small></span>
            <input
              id="signup-profile-image"
              type="url"
              value={form.profileImageUrl}
              onChange={updateField('profileImageUrl')}
              placeholder="https://..."
              maxLength={250}
              disabled={isSubmitting}
            />
          </label>

          <label className="auth-agreement">
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} disabled={isSubmitting} />
            <span><strong>이용약관</strong> 및 <strong>개인정보 처리방침</strong>에 동의합니다.</span>
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '가입 중...' : '회원가입'}
          </button>
        </form>
      </main>
    </div>
  );
}
