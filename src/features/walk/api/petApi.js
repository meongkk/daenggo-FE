import apiClient from '../../../lib/apiClient';

/** JWT 로그인 사용자의 반려동물 목록을 조회한다. */
export const getMyPetsApi = async () => {

    const response = await apiClient.get(
        "/api/pets"
    );

    return response;

};
