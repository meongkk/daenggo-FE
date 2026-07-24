import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createBoardPost, uploadBoardImages } from '../api/boardApi';
import { BOARD_CATEGORIES } from '../boardConstants';
import BottomNavigation from '../../../components/BottomNavigation';
import './Board.css';

const MAX_IMAGE_COUNT = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// 로그인 기능이 붙기 전까지 사용할 개발용 작성자 ID입니다. 로그인 구현 후 실제 사용자 ID로 바꾸면 됩니다.

export default function BoardWritePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get('category');

    const initialBoardType = BOARD_CATEGORIES.some(
        (category) => category.value === categoryFromUrl
    )
        ? categoryFromUrl
        : BOARD_CATEGORIES[0].value;
    const [boardType, setBoardType] = useState(initialBoardType);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tradeStatus, setTradeStatus] = useState('SELL');
    const [price, setPrice] = useState('');
    const [images, setImages] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // 선택한 사진을 서버에 올리기 전에 화면에서 바로 확인할 수 있게 임시 주소를 만듭니다.
    const imagePreviews = useMemo(
        () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
        [images]
    );

    // 사진을 바꾸거나 페이지를 나갈 때 임시 주소를 정리해 메모리 낭비를 막습니다.
    useEffect(() => (
        () => imagePreviews.forEach(({ url }) => URL.revokeObjectURL(url))
    ), [imagePreviews]);

    // 사용자가 고른 사진의 형식, 크기, 개수를 확인한 뒤 실제 전송 목록에 저장합니다.
    const handleImageChange = (event) => {
        const selectedFiles = Array.from(event.target.files ?? []);
        event.target.value = '';

        if (images.length + selectedFiles.length > MAX_IMAGE_COUNT) {
            alert(`사진은 최대 ${MAX_IMAGE_COUNT}장까지 등록할 수 있어요.`);
            return;
        }

        const invalidTypeFile = selectedFiles.find((file) => !ALLOWED_IMAGE_TYPES.includes(file.type));
        if (invalidTypeFile) {
            alert('JPG, PNG, WEBP 형식의 사진만 등록할 수 있어요.');
            return;
        }

        const oversizedFile = selectedFiles.find((file) => file.size > MAX_IMAGE_SIZE);
        if (oversizedFile) {
            alert('사진 한 장의 크기는 10MB 이하여야 해요.');
            return;
        }

        setImages((currentImages) => [...currentImages, ...selectedFiles]);
        setSubmitError('');
    };

    const removeImage = (imageIndex) => {
        setImages((currentImages) => currentImages.filter((_, index) => index !== imageIndex));
    };

    // 이미지를 먼저 업로드한 뒤 반환된 URL과 게시글 정보를 JSON으로 전송한다.
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }

        if (boardType === 'MARKET' && (!price || Number(price) < 0)) {
            alert('올바른 가격을 입력해주세요.');
            return;
        }

        try {
            setIsSubmitting(true);
            setSubmitError('');

            const imageUrls = await uploadBoardImages(images);
            const requestData = {
                category: boardType,
                title: title.trim(),
                content: content.trim(),
                imageUrls,
                // 장터 글일 때만 가격과 거래 종류(팝니다/삽니다)를 백엔드에 함께 보냅니다.
                ...(boardType === 'MARKET'
                    ? { price: Number(price), tradeStatus }
                    : {}),
            };

            await createBoardPost(requestData);
            alert('게시글이 등록되었습니다.');
            navigate('/board');
        } catch (error) {
            const errorMessage = error.response?.data?.message
                ?? error.message
                ?? '게시글을 등록하지 못했습니다. 잠시 후 다시 시도해주세요.';
            setSubmitError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mobile-container board-write-page">
            <header className="header write-header">
                <button
                    type="button"
                    className="back-button"
                    onClick={() => navigate(-1)}
                    aria-label="이전 화면으로 이동"
                >
                    ←
                </button>
                커뮤니티
            </header>

            <form className="write-form" onSubmit={handleSubmit}>
                <div className="write-container">
                    <div className="write-board-selector">
                        <div className="board-type-selector">
                            <label className="sr-only" htmlFor="board-type">게시판 선택</label>
                            <select
                                id="board-type"
                                className="board-type-select"
                                value={boardType}
                                onChange={(event) => setBoardType(event.target.value)}
                            >
                                {BOARD_CATEGORIES.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {boardType === 'MARKET' && (
                        <div className="market-options">
                            <div className="trade-status-buttons">
                                <button
                                    type="button"
                                    className={tradeStatus === 'SELL' ? 'trade-status-button active' : 'trade-status-button'}
                                    onClick={() => setTradeStatus('SELL')}
                                >
                                    팝니다
                                </button>
                                <button
                                    type="button"
                                    className={tradeStatus === 'BUY' ? 'trade-status-button active' : 'trade-status-button'}
                                    onClick={() => setTradeStatus('BUY')}
                                >
                                    삽니다
                                </button>
                            </div>
                            <label className="sr-only" htmlFor="market-price">가격</label>
                            <input
                                id="market-price"
                                type="number"
                                className="title-input"
                                min="0"
                                inputMode="numeric"
                                placeholder="가격을 입력해주세요 (원)"
                                value={price}
                                onChange={(event) => setPrice(event.target.value)}
                            />
                        </div>
                    )}

                    <section className="image-upload-section" aria-labelledby="image-upload-title">
                        <div className="image-upload-heading">
                            <span id="image-upload-title">사진</span>
                            <span>{images.length}/{MAX_IMAGE_COUNT}</span>
                        </div>

                        <input
                            id="board-images"
                            className="sr-only"
                            type="file"
                            accept={ALLOWED_IMAGE_TYPES.join(',')}
                            multiple
                            onChange={handleImageChange}
                        />

                        {images.length === 0 ? (
                            <label className="image-upload-box" htmlFor="board-images">
                                <span className="image-upload-plus" aria-hidden="true">＋</span>
                                <span className="image-upload-text">사진 추가</span>
                            </label>
                        ) : (
                            <div className="image-preview-list">
                                {imagePreviews.map(({ file, url }, index) => (
                                    <div className="image-preview-item" key={`${file.name}-${file.lastModified}-${index}`}>
                                        <img src={url} alt={`선택한 사진 ${index + 1}`} />
                                        <button
                                            type="button"
                                            className="image-remove-button"
                                            onClick={() => removeImage(index)}
                                            aria-label={`${index + 1}번째 사진 삭제`}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {images.length < MAX_IMAGE_COUNT && (
                                    <label className="image-add-button" htmlFor="board-images" aria-label="사진 더 추가">
                                        <span aria-hidden="true">＋</span>
                                    </label>
                                )}
                            </div>
                        )}
                        <p className="image-upload-guide">JPG, PNG, WEBP · 장당 최대 10MB</p>
                    </section>

                    <label className="sr-only" htmlFor="board-title">게시글 제목</label>
                    <input
                        id="board-title"
                        type="text"
                        className="title-input"
                        placeholder="게시판 제목"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                    />

                    <label className="sr-only" htmlFor="board-content">게시글 내용</label>
                    <textarea
                        id="board-content"
                        className="content-textarea"
                        placeholder="게시판 내용"
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                    />

                    {submitError && (
                        <p className="submit-error" role="alert">{submitError}</p>
                    )}
                </div>

                <div className="submit-btn-wrapper">
                    <button className="submit-btn" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? '등록 중...' : '등록하기'}
                    </button>
                </div>
            </form>

            <BottomNavigation />
        </div>
    );
}
