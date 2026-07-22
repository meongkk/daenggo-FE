import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBoardPost } from '../api/boardApi';
import { getCategoryLabel } from '../boardConstants';
import './Board.css';
import mapIcon from '../../../assets/icons/map.svg';
import walkIcon from '../../../assets/icons/walk.svg';
import communityActiveIcon from '../../../assets/icons/community.svg';
import mypageIcon from '../../../assets/icons/mypage.svg';

export default function BoardDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [commentInput, setCommentInput] = useState('');

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadPost() {
            try {
                setIsLoading(true);
                setLoadError('');
                const data = await getBoardPost(id);
                if (isCurrentRequest) setPost(data);
            } catch (error) {
                if (isCurrentRequest) setLoadError(error.response?.data?.message ?? error.message);
            } finally {
                if (isCurrentRequest) setIsLoading(false);
            }
        }

        loadPost();
        return () => { isCurrentRequest = false; };
    }, [id]);

    const navItems = [
        { label: '지도', icon: mapIcon, isActive: false },
        { label: '산책', icon: walkIcon, isActive: false },
        { label: '커뮤니티', icon: communityActiveIcon, isActive: true },
        { label: '마이페이지', icon: mypageIcon, isActive: false },
    ];

    return (
        <div className="mobile-container">
            <header className="header write-header">
                <button type="button" className="back-button" onClick={() => navigate(-1)} aria-label="이전 화면으로 이동">
                    ←
                </button>
                커뮤니티
            </header>

            <main style={{ flex: 1, overflowY: 'auto' }}>
                {isLoading && <p className="board-state-message">게시글을 불러오는 중입니다.</p>}
                {!isLoading && loadError && <p className="submit-error">{loadError}</p>}
                {!isLoading && post && (
                    <>
                        <div className="detail-category">{getCategoryLabel(post.type)}</div>
                        <div style={{ padding: '0 20px' }}>
                            {post.imageUrls?.[0] ? (
                                <img className="post-image-placeholder" src={post.imageUrls[0]} alt="" style={{ marginTop: '15px' }} />
                            ) : (
                                <div className="post-image-placeholder" style={{ marginTop: '15px' }}>🖼️</div>
                            )}
                            <div className="post-info-row">
                                <span className="nickname">{post.nickname || '사용자'}</span>
                                <span className="stats">조회 {post.viewCount}</span>
                            </div>
                            <h2>{post.title}</h2>
                            <div className="post-content">{post.content}</div>
                        </div>
                    </>
                )}
            </main>

            {/* 댓글 API가 연결되기 전에도 기존 입력 UI는 유지합니다. */}
            <div className="comment-input-area">
                <input
                    type="text"
                    placeholder="댓글 남기기"
                    value={commentInput}
                    onChange={(event) => setCommentInput(event.target.value)}
                />
                <button
                    type="button"
                    className="comment-send-btn"
                    onClick={() => alert('댓글 등록 API 연결이 필요합니다.')}
                    aria-label="댓글 등록"
                >
                    ➤
                </button>
            </div>

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
