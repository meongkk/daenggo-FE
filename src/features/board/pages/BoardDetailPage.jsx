// src/features/board/pages/BoardDetailPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNavigation from '../../../components/navigation/BottomNavigation';
import './Board.css';

export default function BoardDetailPage() {
    // 1. 주소창에서 게시글 번호(/board/1 등)를 뽑아옵니다.
    const { id } = useParams();
    const navigate = useNavigate();

    // 2. 댓글 입력창의 글자를 기억할 State
    const [commentInput, setCommentInput] = useState('');

    // (가짜 데이터) 나중에는 추출한 id를 백엔드로 보내서 진짜 데이터를 받아옵니다.
    const postDetail = {
        category: '소통 게시판',
        nickname: '닉네임',
        content: '저 오늘 강아지 산책시켰어요\n다음엔 같이 산책할 사람을 구합니다 ~~',
        likes: 6,
        comments: 1
    };

    const dummyComments = [
        { id: 1, nickname: '닉네임2', content: '다음에 같이 시켜요 ^^' }
    ];

    return (
        <div className="mobile-container">
            {/* 뒤로가기 버튼이 포함된 헤더 */}
            <header className="header" style={{ position: 'relative' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ position: 'absolute', left: '20px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
                >
                    ←
                </button>
                커뮤니티
            </header>

            {/* 스크롤 영역 */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <div className="detail-category">{postDetail.category} ^</div>

                <div style={{ padding: '0 20px' }}>
                    <div className="post-image-placeholder" style={{ marginTop: '15px' }}>🖼️</div>

                    <div className="post-info-row">
                        <span className="nickname">{postDetail.nickname}</span>
                    </div>
                    <div className="post-content">{postDetail.content}</div>

                    <div className="stats" style={{ justifyContent: 'flex-end', marginTop: '15px' }}>
                        <span>🤍 {postDetail.likes}</span>
                        <span>💬 {postDetail.comments}</span>
                    </div>
                </div>

                <div className="divider"></div>

                {/* 댓글 목록 */}
                <div className="comment-list">
                    {dummyComments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                            <div className="nickname">{comment.nickname}</div>
                            <div className="content">{comment.content}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 댓글 입력창 (하단 고정) */}
            <div className="comment-input-area">
                <input
                    type="text"
                    placeholder="댓글 남기기"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                />
                <button className="comment-send-btn">➤</button>
            </div>

            <BottomNavigation active="community" />
        </div>
    );
}
