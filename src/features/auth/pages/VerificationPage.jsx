import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppIcon from '../../../components/ui/AppIcon';
import './Auth.css';

export default function VerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'daenggo@example.com';
  const [code, setCode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setCode((current) => current.map((item, itemIndex) => (itemIndex === index ? digit : item)));
    if (digit && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (code.some((digit) => !digit)) {
      setError('4자리 인증번호를 입력해주세요.');
      return;
    }
    navigate('/mypage');
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('');
    if (pasted.length) {
      event.preventDefault();
      setCode([...pasted, '', '', '', ''].slice(0, 4));
    }
  };

  return (
    <div className="mobile-screen auth-screen auth-detail-screen">
      <button className="screen-back-button" type="button" onClick={() => navigate(-1)} aria-label="뒤로 가기">
        <AppIcon name="back" />
      </button>
      <main className="verification-content">
        <h1>인증번호를 입력해주세요</h1>
        <p><strong>{email}</strong>으로<br />4자리 인증번호를 전송했습니다.</p>
        <form onSubmit={handleSubmit}>
          <div className="verification-code" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputRefs.current[index] = element; }}
                value={digit}
                onChange={(event) => handleChange(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                inputMode="numeric"
                aria-label={`인증번호 ${index + 1}번째 자리`}
                maxLength="1"
              />
            ))}
          </div>
          <button className="auth-text-button verification-resend" type="button">인증번호 다시 받기</button>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-primary-button" type="submit">계속하기</button>
        </form>
      </main>
    </div>
  );
}
