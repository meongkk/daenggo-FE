import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeOAuthToken } from '../api/authApi';
import { saveTokens } from '../api/tokenStorage';
import './Auth.css';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const exchangeStartedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (exchangeStartedRef.current) {
      return;
    }

    exchangeStartedRef.current = true;

    const exchangeToken = async () => {
      try {
        const tokens = await exchangeOAuthToken();

        if (!tokens?.accessToken || !tokens?.refreshToken) {
          throw new Error('로그인 응답에 필요한 토큰이 없습니다.');
        }

        saveTokens(tokens);
        navigate('/map', { replace: true });
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          navigate('/login?oauthError=oauth_session_expired', { replace: true });
          return;
        }

        setError('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
      }
    };

    exchangeToken();
  }, [navigate]);

  return (
    <div className="mobile-screen auth-screen oauth-status-screen">
      <main className="oauth-status-content">
        {!error ? (
          <>
            <span className="oauth-loading-spinner" aria-hidden="true" />
            <h1>카카오 로그인 중</h1>
            <p>로그인 정보를 안전하게 확인하고 있습니다.</p>
          </>
        ) : (
          <>
            <h1>로그인하지 못했습니다</h1>
            <p className="auth-error" role="alert">{error}</p>
            <button
              className="auth-primary-button"
              type="button"
              onClick={() => navigate('/login', { replace: true })}
            >
              로그인 화면으로 돌아가기
            </button>
          </>
        )}
      </main>
    </div>
  );
}
