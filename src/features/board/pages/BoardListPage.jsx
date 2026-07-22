import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoardPosts } from '../api/boardApi';
import { BOARD_CATEGORIES } from '../boardConstants';
import BottomNavigation from '../../../components/BottomNavigation';
import './Board.css';

function formatCreatedAt(createdAt) {
    if (!createdAt) return '';

    const createdTime = new Date(createdAt).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - createdTime) / 1000));

    if (elapsedSeconds < 60) return '방금 전';
    if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}분 전`;
    if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}시간 전`;
    if (elapsedSeconds < 604800) return `${Math.floor(elapsedSeconds / 86400)}일 전`;

    return new Date(createdAt).toLocaleDateString('ko-KR');
}

// 사진 주소가 없거나 불러오지 못해도 깨진 이미지 대신 기본 칸을 보여줍니다.
function PostThumbnail({ imageUrl, title }) {
    const [hasImageError, setHasImageError] = useState(false);

    if (!imageUrl || hasImageError) {
        return <div className="post-card-thumbnail post-card-thumbnail-empty" aria-hidden="true">🖼️</div>;
    }

    return (
        <img
            className="post-card-thumbnail"
            src={imageUrl}
            alt={`${title} 게시글 사진`}
            onError={() => setHasImageError(true)}
        />
    );
}

export default function BoardListPage() {
    const navigate = useNavigate();
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

    const handleBoardChange = (event) => {
        const selectedCategory = BOARD_CATEGORIES.find(
            (category) => category.value === event.target.value
        );

        if (selectedCategory) setCurrentBoard(selectedCategory);
    };

    return (
        <div className="mobile-container">
            <header className="header">커뮤니티</header>

            <div className="list-board-selector">
                <div className="board-type-selector">
                    <label className="sr-only" htmlFor="board-list-type">게시판 선택</label>
                    <select
                        id="board-list-type"
                        className="board-type-select"
                        value={currentBoard.value}
                        onChange={handleBoardChange}
                    >
                    {BOARD_CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                            {category.label}
                        </option>
                    ))}
                    </select>
                </div>
            </div>

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
                        <div className="post-card-main">
                            <div className="post-card-copy">
                                <h2 className="post-card-title">{post.title}</h2>
                                <p className="post-card-summary">{post.content}</p>
                            </div>
                            <PostThumbnail imageUrl={post.imageUrls?.[0]} title={post.title} />
                        </div>
                        <div className="post-card-footer">
                            <span className="post-card-meta">
                                {post.nickname || '사용자'} · {formatCreatedAt(post.createdAt)}
                            </span>
                            <span className="post-card-stats">
                                <span>조회 {post.viewCount ?? 0}</span>
                                <span>💬 {post.commentCount ?? 0}</span>
                            </span>
                        </div>
                    </article>
                ))}
            </div>

            <button className="fab-write" onClick={() => navigate('/board/write')}>✏️</button>

            <BottomNavigation />
        </div>
    );
}
