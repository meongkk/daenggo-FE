import {
    getGroupPets,
    getMyGroups,
} from '../../group/api/groupApi';
import { getMyPets } from '../../pet/api/petApi';

/**
 * 로그인 사용자가 산책에 연결할 수 있는 반려동물을 조회합니다.
 * 내 반려동물과 가입한 그룹의 반려동물을 petId 기준으로 합칩니다.
 */
export async function getWalkablePets({ signal } = {}) {
    const [myPets, groups] = await Promise.all([
        getMyPets({ signal }),
        getMyGroups({ signal }),
    ]);
    const groupPetResults = await Promise.allSettled(
        groups.map((group) => getGroupPets(group.groupId, { signal })),
    );

    if (signal?.aborted) {
        const canceledRequest = groupPetResults.find(
            (result) => result.status === 'rejected',
        );
        throw canceledRequest?.reason ?? new Error('반려동물 조회가 취소되었습니다.');
    }

    const groupPets = groupPetResults.flatMap((result) => (
        result.status === 'fulfilled' ? result.value : []
    ));
    const petsById = new Map();

    [...myPets, ...groupPets].forEach((pet) => {
        petsById.set(Number(pet.petId), pet);
    });

    return [...petsById.values()];
}
