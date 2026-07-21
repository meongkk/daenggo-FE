import axios from 'axios';

// 백엔드 주소가 정해지면 .env 파일의 VITE_BOARD_WRITE_API_URL 값만 채우면 됩니다.
const BOARD_WRITE_API_URL = import.meta.env.VITE_BOARD_WRITE_API_URL;
const BOARD_IMAGE_API_URL = import.meta.env.VITE_BOARD_IMAGE_API_URL;

/**
 * 사진 한 장을 이미지 API에 보내고, 백엔드에 저장된 사진 주소를 돌려받습니다.
 */
async function uploadBoardImage(image) {
    if (!BOARD_IMAGE_API_URL) {
        throw new Error('이미지 업로드 API 주소가 없습니다. .env에 VITE_BOARD_IMAGE_API_URL을 입력해주세요.');
    }

    const formData = new FormData();
    formData.append('image', image);

    // Content-Type은 브라우저가 multipart 경계값과 함께 자동으로 설정합니다.
    const response = await axios.post(BOARD_IMAGE_API_URL, formData);
    const imageUrl = response.data?.imageUrl;

    if (!imageUrl) {
        throw new Error('이미지 업로드 결과에서 이미지 주소를 받지 못했습니다.');
    }

    return imageUrl;
}

/**
 * 선택한 사진을 모두 업로드하고 선택 순서대로 이미지 주소 목록을 만듭니다.
 */
export async function uploadBoardImages(images = []) {
    return Promise.all(images.map((image) => uploadBoardImage(image)));
}

/**
 * 백엔드가 요구하는 application/json 형식으로 게시글 정보를 전송합니다.
 * axios가 객체를 JSON으로 바꾸지만, 형식을 명확히 알 수 있도록 Content-Type도 적어둡니다.
 */
export async function createBoardPost(requestData) {
    if (!BOARD_WRITE_API_URL) {
        throw new Error('게시글 등록 API 주소가 없습니다. .env에 VITE_BOARD_WRITE_API_URL을 입력해주세요.');
    }

    const response = await axios.post(BOARD_WRITE_API_URL, requestData, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
}
