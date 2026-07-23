import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../../../lib/apiError';
import PuppyIllustration from '../components/PuppyIllustration';
import PasswordField from '../components/PasswordField';
import { login } from '../api/authApi';
import { saveTokens } from '../api/tokenStorage';
import './Auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const tokens = await login({
        email: email.trim(),
        password,
      });

      if (!tokens?.accessToken || !tokens?.refreshToken) {
        throw new Error('로그인 응답에 필요한 토큰이 없습니다.');
      }

      saveTokens(tokens);
      navigate(location.state?.from || '/mypage', { replace: true });
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 400 || status === 401) {
        setError('이메일 또는 비밀번호를 확인해주세요.');
      } else if (status >= 500) {
        setError('서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError(getApiErrorMessage(requestError, '로그인하지 못했습니다. 다시 시도해주세요.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-screen auth-screen auth-login-screen">
      <main className="auth-login-content">
        <PuppyIllustration />
        <h1>환영합니다!</h1>
        {location.state?.message && (
          <p className="auth-success" role="status">{location.state.message}</p>
        )}

        <form className="auth-form auth-login-form" onSubmit={handleSubmit}>
          <label className="auth-field" htmlFor="email">
            <span className="sr-only">이메일 주소</span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="이메일 주소"
              autoComplete="email"
              disabled={isSubmitting}
            />
          </label>

          <PasswordField
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호"
            disabled={isSubmitting}
          />

          <button className="auth-text-button auth-forgot-button" type="button">
            비밀번호를 잊으셨나요?
          </button>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="auth-signup-prompt">
          회원이 아니신가요?{' '}
          <button type="button" onClick={() => navigate('/signup')}>회원가입</button>
        </p>

        <div className="auth-divider"><span>다른 로그인</span></div>
        <div className="social-login" aria-label="소셜 로그인">
          <button type="button" className="social-login__button social-login__button--google" aria-label="Google로 로그인">G</button>
          <button type="button" className="social-login__button social-login__button--apple" aria-label="Apple로 로그인">●</button>
          <button type="button" className="social-login__button social-login__button--kakao" aria-label="카카오로 로그인"><span /></button>
        </div>
      </main>
    </div>
  );
}
