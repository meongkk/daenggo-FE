import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeOAuthSignup } from '../api/authApi';
import { saveTokens } from '../api/tokenStorage';
import './Auth.css';

export default function OAuthNicknamePage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();
    const trimmedNickname = nickname.trim();

    if (!trimmedNickname) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    if (trimmedNickname.length > 50) {
      setError('닉네임은 50자 이하여야 합니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const tokens = await completeOAuthSignup(trimmedNickname);

      if (!tokens?.accessToken || !tokens?.refreshToken) {
        throw new Error('회원가입 응답에 필요한 토큰이 없습니다.');
      }

      saveTokens(tokens);
      navigate('/map', { replace: true });
    } catch (requestError) {
      const status = requestError.response?.status;

      if (status === 409) {
        setError('이미 사용 중인 닉네임입니다.');
      } else if (status === 401) {
        setError('로그인 시간이 만료되었습니다. 카카오 로그인을 다시 시작해주세요.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-screen auth-screen auth-detail-screen">
      <main className="auth-detail-content oauth-nickname-content">
        <div className="oauth-kakao-mark" aria-hidden="true">
          <span />
        </div>
        <h1>사용할 닉네임을 알려주세요</h1>
        <p className="auth-subtitle">
          댕고에서 표시할 닉네임을 입력하면 가입이 완료됩니다.
        </p>

        <form className="auth-form auth-signup-form" onSubmit={handleSignup}>
          <label className="auth-field" htmlFor="oauth-nickname">
            <span>닉네임</span>
            <input
              id="oauth-nickname"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="닉네임을 입력해주세요"
              autoComplete="nickname"
              maxLength={50}
              disabled={isSubmitting}
            />
          </label>

          {error && <p className="auth-error" role="alert">{error}</p>}

          <button
            className="auth-primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? '가입 중...' : '가입 완료'}
          </button>
        </form>

        <button
          className="auth-text-button oauth-login-restart"
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          disabled={isSubmitting}
        >
          로그인 화면으로 돌아가기
        </button>
      </main>
    </div>
  );
}
