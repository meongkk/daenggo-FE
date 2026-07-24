import apiClient from '../../../lib/apiClient';

const COMMUNITY_POST_API_URL = import.meta.env.VITE_BOARD_WRITE_API_URL
    ?? '/api/community/posts';
const COMMUNITY_IMAGE_API_URL = '/api/community/images';

/** 이미지 파일을 업로드하고 게시글에 저장할 URL 목록을 반환한다. */
export async function uploadBoardImages(imageFiles) {
    const imageUrls = [];
    for (const imageFile of imageFiles) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await apiClient.post(COMMUNITY_IMAGE_API_URL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (!response.data?.imageUrl) {
            throw new Error('서버에서 이미지 주소를 받지 못했습니다.');
        }
        imageUrls.push(response.data.imageUrl);
    }
    return imageUrls;
}

/** JWT 로그인 사용자를 작성자로 하여 게시글을 등록한다. */
export async function createBoardPost(requestData) {
    const response = await apiClient.post(COMMUNITY_POST_API_URL, requestData);
    return response.data;
}

/** 카테고리에 맞는 게시글 목록을 조회한다. */
export async function getBoardPosts(category) {
    const response = await apiClient.get(COMMUNITY_POST_API_URL, { params: { category } });
    return response.data;
}

/** JWT 로그인 사용자가 작성자인 경우 게시글을 삭제한다. */
export async function deleteBoardPost(postId) {
    await apiClient.delete(`${COMMUNITY_POST_API_URL}/${postId}`);
}

/** JWT 로그인 사용자가 작성자인 경우 게시글을 수정한다. */
export async function updateBoardPost(postId, requestData) {
    const response = await apiClient.patch(`${COMMUNITY_POST_API_URL}/${postId}`, requestData);
    return response.data;
}

/** 게시글 상세를 조회한다. */
export async function getBoardPost(postId) {
    const response = await apiClient.get(`${COMMUNITY_POST_API_URL}/${postId}`);
    return response.data;
}

/** 게시글의 댓글 목록을 조회한다. */
export async function getBoardComments(postId) {
    const response = await apiClient.get(`${COMMUNITY_POST_API_URL}/${postId}/comments`);
    return response.data;
}

/** JWT 로그인 사용자를 작성자로 하여 댓글을 등록한다. */
export async function createBoardComment(postId, requestData) {
    const response = await apiClient.post(`${COMMUNITY_POST_API_URL}/${postId}/comments`, requestData);
    return response.data;
}

/** JWT 로그인 사용자가 작성자인 경우 댓글을 수정한다. */
export async function updateBoardComment(postId, commentId, requestData) {
    const response = await apiClient.patch(
        `${COMMUNITY_POST_API_URL}/${postId}/comments/${commentId}`,
        requestData
    );
    return response.data;
}

/** JWT 로그인 사용자가 작성자인 경우 댓글을 삭제한다. */
export async function deleteBoardComment(postId, commentId) {
    await apiClient.delete(`${COMMUNITY_POST_API_URL}/${postId}/comments/${commentId}`);
}
