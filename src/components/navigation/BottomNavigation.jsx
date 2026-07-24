import { useNavigate } from 'react-router-dom';
import AppIcon from '../ui/AppIcon';
import './BottomNavigation.css';

const navigationItems = [
  { id: 'map', label: '지도', icon: 'compass' },
  { id: 'walk', label: '산책', icon: 'walk' },
  { id: 'community', label: '커뮤니티', icon: 'chat', path: '/board' },
  { id: 'mypage', label: '마이페이지', icon: 'user', path: '/mypage' },
];

export default function BottomNavigation({ active = 'mypage' }) {
  const navigate = useNavigate();

  return (
    <nav className="app-bottom-nav" aria-label="하단 메뉴">
      {navigationItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`app-bottom-nav__item ${active === item.id ? 'is-active' : ''}`}
          onClick={() => item.path && navigate(item.path)}
          aria-current={active === item.id ? 'page' : undefined}
          aria-disabled={!item.path}
        >
          <AppIcon name={item.icon} size={21} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
