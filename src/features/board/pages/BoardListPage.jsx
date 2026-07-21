import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoardPosts } from '../api/boardApi';
import { BOARD_CATEGORIES } from '../boardConstants';
import './Board.css';
import mapIcon from '../../../assets/icons/map.svg';
import walkIcon from '../../../assets/icons/walk.svg';
import communityActiveIcon from '../../../assets/icons/community.svg';
import mypageIcon from '../../../assets/icons/mypage.svg';

export default function BoardListPage() {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [currentBoard, setCurrentBoard] = useState(BOARD_CATEGORIES[0]);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadPosts() {
            try {
                setIsLoading(true);
                setLoadError('');
                const data = await getBoardPosts(currentBoard.value);
                if (isCurrentRequest) setPosts(data);
            } catch (error) {
                if (isCurrentRequest) {
                    setPosts([]);
                    setLoadError(error.response?.data?.message ?? '게시글을 불러오지 못했습니다.');
                }
            } finally {
                if (isCurrentRequest) setIsLoading(false);
            }
        }

        loadPosts();
        return () => { isCurrentRequest = false; };
    }, [currentBoard]);

    const handleBoardSelect = (category) => {
        setCurrentBoard(category);
        setIsDropdownOpen(false);
    };

    const navItems = [
        { label: '지도', icon: mapIcon, isActive: false },
        { label: '산책', icon: walkIcon, isActive: false },
        { label: '커뮤니티', icon: communityActiveIcon, isActive: true },
        { label: '마이페이지', icon: mypageIcon, isActive: false },
    ];

    return (
        <div className="mobile-container">
            <header className="header">커뮤니티</header>

            <button
                type="button"
                className="board-selector"
                onClick={() => setIsDropdownOpen((isOpen) => !isOpen)}
            >
                <span>{currentBoard.label}</span>
                <span>{isDropdownOpen ? '∧' : '∨'}</span>
            </button>

            {isDropdownOpen && (
                <div className="dropdown-menu">
                    {BOARD_CATEGORIES.map((category) => (
                        <button
                            type="button"
                            key={category.value}
                            className="dropdown-item"
                            onClick={() => handleBoardSelect(category)}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="post-list">
                {isLoading && <p className="board-state-message">게시글을 불러오는 중입니다.</p>}
                {!isLoading && loadError && <p className="submit-error">{loadError}</p>}
                {!isLoading && !loadError && posts.length === 0 && (
                    <p className="board-state-message">등록된 게시글이 없습니다.</p>
                )}
                {!isLoading && !loadError && posts.map((post) => (
                    <article
                        key={post.id}
                        className="post-card"
                        onClick={() => navigate(`/board/${post.id}`)}
                    >
                        {post.imageUrls?.[0] ? (
                            <img className="post-image-placeholder" src={post.imageUrls[0]} alt="" />
                        ) : (
                            <div className="post-image-placeholder">🖼️</div>
                        )}
                        <div className="post-info-row">
                            <span className="nickname">{post.nickname || '사용자'}</span>
                            <span className="stats">조회 {post.viewCount}</span>
                        </div>
                        <div className="post-content">{post.title}</div>
                    </article>
                ))}
            </div>

            <button className="fab-write" onClick={() => navigate('/board/write')}>✏️</button>

            <nav className="bottom-nav" aria-label="주요 메뉴">
                {navItems.map((item) => (
                    <div key={item.label} className={`nav-item ${item.isActive ? 'active' : ''}`}>
                        <img src={item.icon} alt="" />
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>
        </div>
    );
}
