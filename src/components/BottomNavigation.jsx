import { useLocation, useNavigate } from 'react-router-dom';
import mapIcon from '../assets/icons/map.svg';
import mapActiveIcon from '../assets/icons/map-active.svg';
import walkIcon from '../assets/icons/walk.svg';
import walkActiveIcon from '../assets/icons/walk-active.svg';
import communityIcon from '../assets/icons/community.svg';
import communityActiveIcon from '../assets/icons/community-active.svg';
import mypageIcon from '../assets/icons/mypage.svg';
import mypageActiveIcon from '../assets/icons/mypage-active.svg';
import './BottomNavigation.css';


const NAV_ITEMS = [
    { label: '지도', icon: mapIcon, activeIcon: mapActiveIcon, path: '/map' },
    { label: '산책', icon: walkIcon, activeIcon: walkActiveIcon, path: '/walk' },
    { label: '커뮤니티', icon: communityIcon, activeIcon: communityActiveIcon, path: '/board' },
    { label: '마이페이지', icon: mypageIcon, activeIcon: mypageActiveIcon, path: '/mypage' },
];

// 현재 주소를 확인해 선택된 메뉴를 자동으로 주황색으로 표시합니다.
export default function BottomNavigation() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <nav className="app-bottom-nav" aria-label="주요 메뉴">
            {NAV_ITEMS.map((item) => {
                const isActive = item.path ? pathname.startsWith(item.path) : false;

                return (
                    <button
                        key={item.label}
                        type="button"
                        className={`app-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => item.path && navigate(item.path)}
                        disabled={!item.path}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <img src={isActive ? item.activeIcon : item.icon} alt="" />
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
