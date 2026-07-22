import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    createBoardComment,
    getBoardComments,
    getBoardPost,
} from '../api/boardApi';
import { getCategoryLabel } from '../boardConstants';
import BottomNavigation from '../../../components/BottomNavigation';
import './Board.css';

const TEMP_WRITER_ID = Number(import.meta.env.VITE_BOARD_WRITER_ID ?? 1);

export default function BoardDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [commentInput, setCommentInput] = useState('');
    const [comments, setComments] = useState([]);
    const [commentError, setCommentError] = useState('');
    const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadPost() {
            try {
                setIsLoading(true);
                setLoadError('');
                const [postData, commentData] = await Promise.all([
                    getBoardPost(id),
                    getBoardComments(id),
                ]);

                if (isCurrentRequest) {
                    setPost(postData);
                    setComments(commentData);
                }
            } catch (error) {
                if (isCurrentRequest) setLoadError(error.response?.data?.message ?? error.message);
            } finally {
                if (isCurrentRequest) setIsLoading(false);
            }
        }

        loadPost();
        return () => { isCurrentRequest = false; };
    }, [id]);

    // 댓글을 등록하고 성공 응답을 현재 댓글 목록에 바로 추가한다.
    const handleCommentSubmit = async (event) => {
        event.preventDefault();

        const content = commentInput.trim();
        if (!content) return;

        if (!Number.isInteger(TEMP_WRITER_ID) || TEMP_WRITER_ID <= 0) {
            setCommentError('.env의 VITE_BOARD_WRITER_ID에 실제 작성자 ID를 입력해주세요.');
            return;
        }

        try {
            setIsCommentSubmitting(true);
            setCommentError('');

            const createdComment = await createBoardComment(id, {
                content,
                userId: TEMP_WRITER_ID,
            });

            setComments((currentComments) => [...currentComments, createdComment]);
            setCommentInput('');
            setPost((currentPost) => currentPost && ({
                ...currentPost,
                commentCount: (currentPost.commentCount ?? 0) + 1,
            }));
        } catch (error) {
            setCommentError(
                error.response?.data?.message
                ?? error.message
                ?? '댓글을 등록하지 못했습니다.'
            );
        } finally {
            setIsCommentSubmitting(false);
        }
    };

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
                            {post.imageUrls?.length > 0 ? (
                                <div className="detail-image-list">
                                    {post.imageUrls.map((imageUrl, index) => (
                                        <img
                                            key={imageUrl}
                                            className="detail-post-image"
                                            src={imageUrl}
                                            alt={`게시글 이미지 ${index + 1}`}
                                        />
                                    ))}
                                </div>
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

                        <section className="comment-list" aria-label="댓글 목록">
                            <div className="divider" />
                            {commentError && (
                                <p className="submit-error" role="alert">{commentError}</p>
                            )}
                            {comments.length === 0 ? (
                                <p className="board-state-message">첫 댓글을 남겨보세요.</p>
                            ) : comments.map((comment) => (
                                <article className="comment-item" key={comment.id}>
                                    <strong>{comment.nickname || '사용자'}</strong>
                                    <div className="content">{comment.content}</div>
                                </article>
                            ))}
                        </section>
                    </>
                )}
            </main>

            <form className="comment-input-area" onSubmit={handleCommentSubmit}>
                <input
                    type="text"
                    placeholder="댓글 남기기"
                    value={commentInput}
                    onChange={(event) => setCommentInput(event.target.value)}
                    disabled={isCommentSubmitting}
                />
                <button
                    type="submit"
                    className="comment-send-btn"
                    disabled={isCommentSubmitting || !commentInput.trim()}
                    aria-label="댓글 등록"
                >
                    ➤
                </button>
            </form>

            <BottomNavigation />
        </div>
    );
}
