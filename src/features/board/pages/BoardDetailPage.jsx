import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    createBoardComment,
    deleteBoardComment,
    deleteBoardPost,
    getBoardComments,
    getBoardPost,
    updateBoardComment,
    updateBoardPost,
    uploadBoardImages,
} from '../api/boardApi';
import { BOARD_CATEGORIES, getCategoryLabel } from '../boardConstants';
import BoardImageEditor from '../components/BoardImageEditor';
import BottomNavigation from '../../../components/BottomNavigation';
import { getMyInfo } from '../../user/api/userApi';
import './Board.css';

// 백엔드의 UTC 날짜를 사용자의 휴대폰 시간대에 맞는 한국식 날짜로 보여줍니다.
function formatCommentDate(createdAt) {
    if (!createdAt) return '';

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getApiErrorMessage(error, fallbackMessage) {
    return error.response?.data?.detail
        ?? error.response?.data?.message
        ?? error.message
        ?? fallbackMessage;
}

export default function BoardDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [post, setPost] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [commentInput, setCommentInput] = useState('');
    const [comments, setComments] = useState([]);
    const [commentError, setCommentError] = useState('');
    const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingContent, setEditingContent] = useState('');
    const [processingCommentId, setProcessingCommentId] = useState(null);
    const [isPostDeleting, setIsPostDeleting] = useState(false);
    const [postDeleteError, setPostDeleteError] = useState('');
    const [isPostEditing, setIsPostEditing] = useState(false);
    const [editPostTitle, setEditPostTitle] = useState('');
    const [editPostContent, setEditPostContent] = useState('');
    const [isPostUpdating, setIsPostUpdating] = useState(false);
    const [postUpdateError, setPostUpdateError] = useState('');
    const [editExistingImageUrls, setEditExistingImageUrls] = useState([]);
    const [editNewImageFiles, setEditNewImageFiles] = useState([]);
    const categoryFromUrl = searchParams.get('category');
    const returnCategory = BOARD_CATEGORIES.some(
        (category) => category.value === categoryFromUrl
    )
        ? categoryFromUrl
        : post?.type ?? BOARD_CATEGORIES[0].value;

    // 상세 화면을 연 게시판 종류로 돌아갑니다.
    const handleBackToBoard = () => {
        navigate(`/board?category=${returnCategory}`, { replace: true });
    };

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadPost() {
            try {
                setIsLoading(true);
                setLoadError('');
                const [postData, commentData, currentUserData] = await Promise.all([
                    getBoardPost(id),
                    getBoardComments(id),
                    getMyInfo(),
                ]);

                if (isCurrentRequest) {
                    setPost(postData);
                    setComments(commentData);
                    setCurrentUserId(currentUserData.id);
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

        try {
            setIsCommentSubmitting(true);
            setCommentError('');

            const createdComment = await createBoardComment(id, {
                content,
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

    // 수정 버튼을 누르면 해당 댓글 내용을 입력창에 복사해 편집 모드로 바꿉니다.
    const startCommentEdit = (comment) => {
        setEditingCommentId(comment.id);
        setEditingContent(comment.content);
        setCommentError('');
    };

    const cancelCommentEdit = () => {
        setEditingCommentId(null);
        setEditingContent('');
    };

    const handleCommentUpdate = async (event, commentId) => {
        event.preventDefault();
        const content = editingContent.trim();
        if (!content) {
            setCommentError('수정할 댓글 내용을 입력해주세요.');
            return;
        }

        try {
            setProcessingCommentId(commentId);
            setCommentError('');

            const updatedComment = await updateBoardComment(id, commentId, {
                content,
            });

            setComments((currentComments) => currentComments.map((comment) => (
                comment.id === commentId ? updatedComment : comment
            )));
            cancelCommentEdit();
        } catch (error) {
            setCommentError(getApiErrorMessage(error, '댓글을 수정하지 못했습니다.'));
        } finally {
            setProcessingCommentId(null);
        }
    };

    const handleCommentDelete = async (commentId) => {
        const shouldDelete = window.confirm('이 댓글을 삭제할까요?');
        if (!shouldDelete) return;

        try {
            setProcessingCommentId(commentId);
            setCommentError('');
            await deleteBoardComment(id, commentId);

            setComments((currentComments) => (
                currentComments.filter((comment) => comment.id !== commentId)
            ));
            setPost((currentPost) => currentPost && ({
                ...currentPost,
                commentCount: Math.max(0, (currentPost.commentCount ?? 1) - 1),
            }));

            if (editingCommentId === commentId) cancelCommentEdit();
        } catch (error) {
            setCommentError(getApiErrorMessage(error, '댓글을 삭제하지 못했습니다.'));
        } finally {
            setProcessingCommentId(null);
        }
    };

    // 현재 테스트 사용자와 게시글 작성자가 같을 때만 삭제 API를 호출합니다.
    const handlePostDelete = async () => {
        const shouldDelete = window.confirm('이 게시글을 삭제할까요?');
        if (!shouldDelete) return;

        try {
            setIsPostDeleting(true);
            setPostDeleteError('');
            await deleteBoardPost(id);
            navigate(`/board?category=${returnCategory}`, { replace: true });
        } catch (error) {
            setPostDeleteError(getApiErrorMessage(error, '게시글을 삭제하지 못했습니다.'));
        } finally {
            setIsPostDeleting(false);
        }
    };

    // 현재 게시글의 제목과 내용을 수정 입력칸에 복사합니다.
    const startPostEdit = () => {
        setEditPostTitle(post.title);
        setEditPostContent(post.content);
        setEditExistingImageUrls(post.imageUrls ?? []);
        setEditNewImageFiles([]);
        setPostUpdateError('');
        setIsPostEditing(true);
    };

    // 저장하지 않고 수정 입력칸을 닫습니다.
    const cancelPostEdit = () => {
        setIsPostEditing(false);
        setEditNewImageFiles([]);
        setPostUpdateError('');
    };

    // 수정된 제목과 내용을 백엔드로 보내고 성공 응답으로 화면을 갱신합니다.
    const handlePostUpdate = async (event) => {
        event.preventDefault();

        const title = editPostTitle.trim();
        const content = editPostContent.trim();
        if (!title || !content) {
            setPostUpdateError('제목과 내용을 모두 입력해주세요.');
            return;
        }

        try {
            setIsPostUpdating(true);
            setPostUpdateError('');

            const newImageUrls = await uploadBoardImages(editNewImageFiles);
            const imageUrls = [...editExistingImageUrls, ...newImageUrls];
            const updatedPost = await updateBoardPost(id, {
                title,
                content,
                imageUrls,
            });

            setPost(updatedPost);
            setIsPostEditing(false);
            setEditNewImageFiles([]);
        } catch (error) {
            setPostUpdateError(getApiErrorMessage(error, '게시글을 수정하지 못했습니다.'));
        } finally {
            setIsPostUpdating(false);
        }
    };

    const isOwnPost = Number(post?.userId) === Number(currentUserId);

    return (
        <div className="mobile-container">
            <header className="header write-header">
                <button type="button" className="back-button" onClick={handleBackToBoard} aria-label="이전 게시판으로 이동">
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
                            {!isPostEditing && (post.imageUrls?.length > 0 ? (
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
                            ))}
                            <div className="post-info-row">
                                <span className="nickname">{post.nickname || '사용자'}</span>
                                <div className="post-info-actions">
                                    <span className="stats">조회 {post.viewCount}</span>
                                    {isOwnPost && !isPostEditing && (
                                        <div className="post-owner-actions">
                                            <button
                                                type="button"
                                                className="post-edit-button"
                                                onClick={startPostEdit}
                                                disabled={isPostDeleting}
                                            >
                                                수정
                                            </button>
                                            <button
                                                type="button"
                                                className="post-delete-button"
                                                onClick={handlePostDelete}
                                                disabled={isPostDeleting}
                                            >
                                                {isPostDeleting ? '삭제 중...' : '삭제'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {postDeleteError && (
                                <p className="submit-error" role="alert">{postDeleteError}</p>
                            )}
                            {isPostEditing ? (
                                <form className="post-edit-form" onSubmit={handlePostUpdate}>
                                    <BoardImageEditor
                                        existingImageUrls={editExistingImageUrls}
                                        newImageFiles={editNewImageFiles}
                                        onExistingImageUrlsChange={setEditExistingImageUrls}
                                        onNewImageFilesChange={setEditNewImageFiles}
                                        onValidationError={setPostUpdateError}
                                        disabled={isPostUpdating}
                                    />
                                    <label className="sr-only" htmlFor="edit-post-title">수정할 제목</label>
                                    <input
                                        id="edit-post-title"
                                        className="title-input"
                                        type="text"
                                        maxLength="255"
                                        value={editPostTitle}
                                        onChange={(event) => setEditPostTitle(event.target.value)}
                                        disabled={isPostUpdating}
                                    />
                                    <label className="sr-only" htmlFor="edit-post-content">수정할 내용</label>
                                    <textarea
                                        id="edit-post-content"
                                        className="content-textarea"
                                        value={editPostContent}
                                        onChange={(event) => setEditPostContent(event.target.value)}
                                        disabled={isPostUpdating}
                                    />
                                    {postUpdateError && (
                                        <p className="submit-error" role="alert">{postUpdateError}</p>
                                    )}
                                    <div className="post-edit-actions">
                                        <button
                                            type="button"
                                            className="post-edit-cancel-button"
                                            onClick={cancelPostEdit}
                                            disabled={isPostUpdating}
                                        >
                                            취소
                                        </button>
                                        <button
                                            type="submit"
                                            className="post-edit-save-button"
                                            disabled={isPostUpdating}
                                        >
                                            {isPostUpdating ? '저장 중...' : '저장'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <h2>{post.title}</h2>
                                    <div className="post-content">{post.content}</div>
                                </>
                            )}
                        </div>

                        <section className="comment-list" aria-label="댓글 목록">
                            <div className="divider" />
                            <div className="comment-section-heading">
                                <h3>댓글 <span>{comments.length}</span></h3>
                            </div>
                            {commentError && (
                                <p className="submit-error" role="alert">{commentError}</p>
                            )}
                            {comments.length === 0 ? (
                                <p className="board-state-message">첫 댓글을 남겨보세요.</p>
                            ) : comments.map((comment) => {
                                const nickname = comment.nickname || '사용자';
                                const isOwnComment = Number(comment.userId) === Number(currentUserId);
                                const isProcessing = processingCommentId === comment.id;
                                const isEditing = editingCommentId === comment.id;

                                return (
                                    <article className="comment-item" key={comment.id}>
                                        <div className="comment-avatar" aria-hidden="true">
                                            {nickname.charAt(0)}
                                        </div>
                                        <div className="comment-body">
                                            <div className="comment-top-row">
                                                <div className="comment-author-info">
                                                    <strong>{nickname}</strong>
                                                    <time dateTime={comment.createdAt}>
                                                        {formatCommentDate(comment.createdAt)}
                                                    </time>
                                                </div>
                                                {isOwnComment && !isEditing && (
                                                    <div className="comment-actions">
                                                        <button
                                                            type="button"
                                                            onClick={() => startCommentEdit(comment)}
                                                            disabled={isProcessing}
                                                        >
                                                            수정
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="comment-delete-button"
                                                            onClick={() => handleCommentDelete(comment.id)}
                                                            disabled={isProcessing}
                                                        >
                                                            삭제
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isEditing ? (
                                                <form
                                                    className="comment-edit-form"
                                                    onSubmit={(event) => handleCommentUpdate(event, comment.id)}
                                                >
                                                    <textarea
                                                        value={editingContent}
                                                        onChange={(event) => setEditingContent(event.target.value)}
                                                        disabled={isProcessing}
                                                        aria-label="댓글 수정 내용"
                                                        autoFocus
                                                    />
                                                    <div className="comment-edit-actions">
                                                        <button
                                                            type="button"
                                                            className="comment-edit-cancel"
                                                            onClick={cancelCommentEdit}
                                                            disabled={isProcessing}
                                                        >
                                                            취소
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="comment-edit-save"
                                                            disabled={isProcessing || !editingContent.trim()}
                                                        >
                                                            {isProcessing ? '저장 중...' : '저장'}
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <p className="comment-content">{comment.content}</p>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </section>
                    </>
                )}
            </main>

            <form className="comment-input-area" onSubmit={handleCommentSubmit}>
                <input
                    type="text"
                    placeholder="댓글을 입력해주세요"
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
                    등록
                </button>
            </form>

            <BottomNavigation />
        </div>
    );
}
