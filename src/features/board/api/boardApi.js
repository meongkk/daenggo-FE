import axios from 'axios';

const COMMUNITY_POST_API_URL = import.meta.env.VITE_BOARD_WRITE_API_URL
    ?? '/api/community/posts';

const COMMUNITY_IMAGE_API_URL = '/api/community/images';

/**
 * 선택한 이미지 파일들을 차례로 업로드한다.
 *
 * @param {File[]} imageFiles 업로드할 브라우저 이미지 파일 목록
 * @returns {Promise<string[]>} 게시글 등록에 사용할 이미지 URL 목록
 */
export async function uploadBoardImages(imageFiles) {
    const imageUrls = [];

    for (const imageFile of imageFiles) {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await axios.post(COMMUNITY_IMAGE_API_URL, formData);
        const imageUrl = response.data?.imageUrl;

        if (!imageUrl) {
            throw new Error('서버에서 이미지 주소를 받지 못했습니다.');
        }

        imageUrls.push(imageUrl);
    }

    return imageUrls;
}

/**
 * 새로운 커뮤니티 게시글을 등록합니다.
 *
 * @param {object} requestData 백엔드 게시글 등록 요청 데이터
 * @returns {Promise<object>} 등록된 게시글
 */
export async function createBoardPost(requestData) {
    const response = await axios.post(COMMUNITY_POST_API_URL, requestData, {
        headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
}

/**
 * 선택한 카테고리의 게시글 목록을 조회합니다.
 *
 * @param {'FREE'|'MARKET'|'SITTER'} category 백엔드 카테고리 값
 * @returns {Promise<object[]>} 최신순 게시글 목록
 */
export async function getBoardPosts(category) {
    const response = await axios.get(COMMUNITY_POST_API_URL, {
        params: { category },
    });
    return response.data;
}
/**
 * 작성자 본인의 게시글을 삭제한다.
 *
 * @param {string|number} postId 삭제할 게시글 ID
 * @param {number} userId 삭제를 요청한 사용자 ID
 */
export async function deleteBoardPost(postId, userId) {
    await axios.delete(`${COMMUNITY_POST_API_URL}/${postId}`, {
        data: {
            userId,
        },
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

/**
 * 작성자 본인의 게시글 제목과 내용을 수정한다.
 *
 * @param {string|number} postId 수정할 게시글 ID
 * @param {{userId: number, title: string, content: string, imageUrls: string[]}} requestData 수정 요청 데이터
 * @returns {Promise<object>} 수정된 게시글
 */
export async function updateBoardPost(postId, requestData) {
    const response = await axios.patch(
        `${COMMUNITY_POST_API_URL}/${postId}`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
}

/**
 * 게시글 상세를 조회합니다. 상세 API 호출 시 백엔드에서 조회수가 증가합니다.
 *
 * @param {string|number} postId 조회할 게시글 ID
 * @returns {Promise<object>} 조회수가 반영된 게시글 상세
 */
export async function getBoardPost(postId) {
    const response = await axios.get(`${COMMUNITY_POST_API_URL}/${postId}`);
    return response.data;
}

/**
 * 게시글에 등록된 댓글 목록을 조회한다.
 *
 * @param {string|number} postId 댓글을 조회할 게시글 ID
 * @returns {Promise<object[]>} 등록 순서대로 정렬된 댓글 목록
 */
export async function getBoardComments(postId) {
    const response = await axios.get(
        `${COMMUNITY_POST_API_URL}/${postId}/comments`
    );
    return response.data;
}

/**
 * 게시글에 새로운 댓글을 등록한다.
 *
 * @param {string|number} postId 댓글을 등록할 게시글 ID
 * @param {{content: string, userId: number}} requestData 댓글 등록 요청 데이터
 * @returns {Promise<object>} 등록된 댓글
 */
export async function createBoardComment(postId, requestData) {
    const response = await axios.post(
        `${COMMUNITY_POST_API_URL}/${postId}/comments`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
}

/**
 * 작성자 본인의 댓글 내용을 수정한다.
 *
 * @param {string|number} postId 게시글 ID
 * @param {string|number} commentId 수정할 댓글 ID
 * @param {{content: string, userId: number}} requestData 수정 내용과 작성자 ID
 * @returns {Promise<object>} 수정된 댓글
 */
export async function updateBoardComment(postId, commentId, requestData) {
    const response = await axios.patch(
        `${COMMUNITY_POST_API_URL}/${postId}/comments/${commentId}`,
        requestData,
        { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
}

/**
 * 작성자 본인의 댓글을 삭제한다.
 *
 * @param {string|number} postId 게시글 ID
 * @param {string|number} commentId 삭제할 댓글 ID
 * @param {number} userId 삭제를 요청한 사용자 ID
 */
export async function deleteBoardComment(postId, commentId, userId) {
    await axios.delete(
        `${COMMUNITY_POST_API_URL}/${postId}/comments/${commentId}`,
        { params: { userId } }
    );
}
