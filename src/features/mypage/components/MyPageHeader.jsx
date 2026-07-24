import { useNavigate } from 'react-router-dom';
import AppIcon from '../../../components/ui/AppIcon';

export default function MyPageHeader({ title, action }) {
  const navigate = useNavigate();
  return (
    <header className="mypage-header">
      <button type="button" onClick={() => navigate(-1)} aria-label="뒤로 가기">
        <AppIcon name="back" />
      </button>
      <h1>{title}</h1>
      <div className="mypage-header__action">{action}</div>
    </header>
  );
}
