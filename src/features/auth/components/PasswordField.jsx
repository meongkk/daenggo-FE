import { useState } from 'react';
import AppIcon from '../../../components/ui/AppIcon';

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="auth-field" htmlFor={id}>
      {label && <span>{label}</span>}
      <span className="auth-field__control">
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={id === 'password' ? 'current-password' : 'new-password'}
          disabled={disabled}
        />
        <button
          type="button"
          className="auth-field__toggle"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
          disabled={disabled}
        >
          <AppIcon name={isVisible ? 'eye' : 'eyeOff'} size={19} />
        </button>
      </span>
    </label>
  );
}
