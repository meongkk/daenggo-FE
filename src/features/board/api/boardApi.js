import axios from 'axios';

// 백엔드 주소가 정해지면 .env 파일의 VITE_BOARD_WRITE_API_URL 값만 채우면 됩니다.
const BOARD_WRITE_API_URL = import.meta.env.VITE_BOARD_WRITE_API_URL;

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
