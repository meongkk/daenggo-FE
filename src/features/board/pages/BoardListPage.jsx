// src/features/board/pages/BoardListPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Board.css';
import mapIcon from '../../../assets/icons/map.svg';
import walkIcon from '../../../assets/icons/walk.svg';
import communityActiveIcon from '../../../assets/icons/community.svg';
import mypageIcon from '../../../assets/icons/mypage.svg';

// 반복되는 데이터는 컴포넌트 밖으로 분리하여 관리
const BOARD_CATEGORIES = ['장터 게시판', '자유 게시판', '시터/돌봄'];

const DUMMY_POSTS = [
    { id: 1, nickname: '밍구리', content: '테스트용 1', likes: 6, comments: 1 },
    { id: 2, nickname: '석종수', content: '테스트용 3', likes: 2, comments: 0 }
];

export default function BoardListPage() {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentBoard, setCurrentBoard] = useState('소통 게시판');

    const handleBoardSelect = (boardName) => {
        setCurrentBoard(boardName);
        setIsDropdownOpen(false);
    };

    // 하단 네비게이션 데이터 배열화 (추후 라우팅 추가 용이)
    const navItems = [
        { label: '지도', icon: mapIcon, isActive: false },
        { label: '산책', icon: walkIcon, isActive: false },
        { label: '커뮤니티', icon: communityActiveIcon, isActive: true },
        { label: '마이페이지', icon: mypageIcon, isActive: false }
    ];

    return (
        <div className="mobile-container">
            <header className="header">커뮤니티</header>

            <div
                className="board-selector"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
                <span>{currentBoard}</span>
                <span>{isDropdownOpen ? '∧' : '∨'}</span>
            </div>

            {isDropdownOpen && (
                <div className="dropdown-menu">
                    {BOARD_CATEGORIES.map((category) => (
                        <div
                            key={category}
                            className="dropdown-item"
                            onClick={() => handleBoardSelect(category)}
                        >
                            {category}
                        </div>
                    ))}
                </div>
            )}

            <div className="post-list">
                {DUMMY_POSTS.map((post) => (
                    <div key={post.id} className="post-card" onClick={() => navigate(`/board/${post.id}`)}>
                        <div className="post-image-placeholder">🖼️</div>
                        <div className="post-info-row">
                            <span className="nickname">{post.nickname}</span>
                            <div className="stats">
                                <span>🤍 {post.likes}</span>
                                <span>💬 {post.comments}</span>
                            </div>
                        </div>
                        <div className="post-content">{post.content}</div>
                    </div>
                ))}
            </div>

            <button className="fab-write" onClick={() => navigate('/board/write')}>✏️</button>

            <nav className="bottom-nav" style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid #eee' }}>
                {navItems.map((item) => (
                    <div
                        key={item.label}
                        className={`nav-item ${item.isActive ? 'active' : ''}`}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            color: item.isActive ? '#E67E22' : '#999',
                            cursor: 'pointer'
                        }}
                    >
                        <img
                            src={item.icon}
                            alt={item.label}
                            style={{ width: '24px', height: '24px', marginBottom: '4px' }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: item.isActive ? 'bold' : 'normal' }}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </nav>
        </div>
    );
}