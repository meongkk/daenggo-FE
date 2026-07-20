// src/features/board/pages/BoardDetailPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Board.css';
import mapIcon from "../../../assets/icons/map.svg";
import walkIcon from "../../../assets/icons/walk.svg";
import communityActiveIcon from "../../../assets/icons/community.svg";
import mypageIcon from "../../../assets/icons/mypage.svg";

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

            {/* 하단 네비게이션 바 */}
            <nav className="bottom-nav" style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 0', borderTop: '1px solid #eee' }}>

                <div className="nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#999' }}>
                    <img src={mapIcon} alt="지도" style={{ width: '24px', height: '24px', marginBottom: '4px' }} />
                    <span style={{ fontSize: '12px' }}>지도</span>
                </div>

                <div className="nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#999' }}>
                    <img src={walkIcon} alt="산책" style={{ width: '24px', height: '24px', marginBottom: '4px' }} />
                    <span style={{ fontSize: '12px' }}>산책</span>
                </div>

                {/* 현재 커뮤니티 탭이므로 주황색 활성화 아이콘 사용 및 글씨색 변경 */}
                <div className="nav-item active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#E67E22' }}>
                    <img src={communityActiveIcon} alt="커뮤니티" style={{ width: '24px', height: '24px', marginBottom: '4px' }} />
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>커뮤니티</span>
                </div>

                <div className="nav-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#999' }}>
                    <img src={mypageIcon} alt="마이페이지" style={{ width: '24px', height: '24px', marginBottom: '4px' }} />
                    <span style={{ fontSize: '12px' }}>마이페이지</span>
                </div>
            </nav>
        </div>
    );
}