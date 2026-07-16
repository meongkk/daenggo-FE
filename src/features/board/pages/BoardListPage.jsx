// src/features/board/pages/BoardListPage.jsx
import React, { useState } from 'react'; // useState 추가
import { useNavigate } from 'react-router-dom';
import './Board.css';

export default function BoardListPage() {
    const navigate = useNavigate();

    // ★ 1. 드롭다운이 열렸는지 닫혔는지 기억하는 '스위치' (기본값: false 닫힘)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // ★ 2. 현재 선택된 게시판 이름을 기억하는 '바구니' (기본값: 소통 게시판)
    const [currentBoard, setCurrentBoard] = useState('소통 게시판');

    const dummyPosts = [
        { id: 1, nickname: '닉네임', content: '저 오늘 강아지 산책시켰어요\n다음엔 같이 산책할 사람을 구합니다 ~~', likes: 6, comments: 1 },
        { id: 2, nickname: '닉네임', content: '우리 강아지 장난감 나눔합니다!', likes: 2, comments: 0 }
    ];

    // ★ 3. 메뉴를 선택했을 때 실행될 함수
    const handleBoardSelect = (boardName) => {
        setCurrentBoard(boardName); // 선택한 게시판으로 이름 변경
        setIsDropdownOpen(false);   // 메뉴 다시 닫기
    };

    return (
        <div className="mobile-container">
            <header className="header">커뮤니티</header>

            {/* ★ 4. 클릭하면 스위치(isDropdownOpen) 상태를 반대로 뒤집음 (!) */}
            <div className="board-selector" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <span>{currentBoard}</span>
                {/* 스위치가 true면 위쪽 화살표(∧), false면 아래쪽 화살표(∨)를 보여줌 */}
                <span>{isDropdownOpen ? '∧' : '∨'}</span>
            </div>

            {/* ★ 5. 스위치(isDropdownOpen)가 true일 때만 아래 메뉴(div)를 화면에 그림 (&& 연산자 활용) */}
            {isDropdownOpen && (
                <div className="dropdown-menu">
                    <div className="dropdown-item" onClick={() => handleBoardSelect('소통 게시판')}>소통 게시판</div>
                    <div className="dropdown-item" onClick={() => handleBoardSelect('장터 게시판')}>장터 게시판</div>
                    <div className="dropdown-item" onClick={() => handleBoardSelect('자유 게시판')}>자유 게시판</div>
                    <div className="dropdown-item" onClick={() => handleBoardSelect('시터/돌봄')}>시터/돌봄</div>
                </div>
            )}

            {/* --- 이하 게시글 목록 코드는 기존과 동일 --- */}
            <div className="post-list">
                {dummyPosts.map((post) => (
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

            <nav className="bottom-nav">
                <div className="nav-item">🧭 지도</div>
                <div className="nav-item">🛣️ 산책</div>
                <div className="nav-item active">💬 커뮤니티</div>
                <div className="nav-item">👤 마이페이지</div>
            </nav>
        </div>
    );
}