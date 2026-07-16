// src/features/board/pages/BoardWritePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Board.css';

export default function BoardWritePage() {
    const navigate = useNavigate();

    // 1. 사용자가 입력할 데이터를 담아둘 3개의 State (자바의 DTO 필드 역할)
    const [boardType, setBoardType] = useState('게시판 선택');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // 2. [등록하기] 버튼을 눌렀을 때 실행될 함수
    const handleSubmit = () => {
        // 유효성 검사 (제목이나 내용을 안 적었을 때)
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요!');
            return;
        }

        // 나중에는 이 부분에 axios.post('http://localhost:8080/api/boards', { title, content, ... }) 가 들어갑니다.
        console.log('백엔드로 전송할 데이터:', { boardType, title, content });

        alert('게시글이 등록되었습니다!');
        navigate('/board'); // 등록 성공 시 게시판 목록 화면으로 돌려보냄
    };

    return (
        <div className="mobile-container">
            {/* 헤더 */}
            <header className="header" style={{ position: 'relative' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ position: 'absolute', left: '20px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
                >
                    ←
                </button>
                커뮤니티
            </header>

            {/* 작성 영역 */}
            <div className="write-container">
                {/* 게시판 선택란 (UI만) */}
                <div className="board-selector" style={{ padding: '0 0 15px 0' }}>
                    <span style={{ color: '#ccc' }}>{boardType}</span>
                    <span style={{ color: '#ccc' }}>∨</span>
                </div>

                {/* 사진 업로드 영역 */}
                <div className="image-upload-box">
                    +
                </div>

                {/* 제목 입력창 */}
                <input
                    type="text"
                    className="title-input"
                    placeholder="게시판 제목"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)} // 키보드를 칠 때마다 title State 갱신
                />

                {/* 내용 입력창 */}
                <textarea
                    className="content-textarea"
                    placeholder="게시판 내용"
                    value={content}
                    onChange={(e) => setContent(e.target.value)} // 키보드를 칠 때마다 content State 갱신
                ></textarea>
            </div>

            {/* 등록하기 버튼 */}
            <div className="submit-btn-wrapper">
                <button className="submit-btn" onClick={handleSubmit}>
                    등록하기
                </button>
            </div>

            {/* 하단 네비게이션 바 */}
            <nav className="bottom-nav">
                <div className="nav-item">🧭 지도</div>
                <div className="nav-item">🛣️ 산책</div>
                <div className="nav-item active">💬 커뮤니티</div>
                <div className="nav-item">👤 마이페이지</div>
            </nav>
        </div>
    );
}