import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../../../components/BottomNavigation';
import AppIcon from '../../../components/ui/AppIcon';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
  getMyPet,
  getMyPets,
} from '../../pet/api/petApi';
import useProfileImageSource from '../../profile/hooks/useProfileImageSource';
import EmptyImage from '../components/EmptyImage';
import MyPageHeader from '../components/MyPageHeader';
import './MyPage.css';

const PET_SIZE_LABELS = {
  SMALL: '소형견',
  MEDIUM: '중형견',
  LARGE: '대형견',
};

function PetCardImage({ imageUrl, name }) {
  const imageSource = useProfileImageSource(imageUrl);

  return imageSource
    ? <img src={imageSource} alt={`${name} 프로필`} />
    : <EmptyImage />;
}

function isPrimaryPet(pet) {
  return Boolean(pet.primary);
}

export default function PetsPage() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadPets() {
      try {
        const petSummaries = await getMyPets({ signal: controller.signal });
        const petDetails = await Promise.all(
          petSummaries.map(async (petSummary) => ({
            ...petSummary,
            ...(await getMyPet(petSummary.petId, { signal: controller.signal })),
          })),
        );

        setPets(petDetails);
      } catch (requestError) {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(getApiErrorMessage(requestError, '반려동물 목록을 불러오지 못했습니다.'));
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadPets();

    return () => controller.abort();
  }, []);

  const addButton = (
    <button className="mypage-add-button" type="button" onClick={() => navigate('/mypage/pets/new')}><AppIcon name="plus" size={18} /> 추가하기</button>
  );
  const sortedPets = [...pets].sort(
    (firstPet, secondPet) =>
      Number(isPrimaryPet(secondPet)) - Number(isPrimaryPet(firstPet)),
  );

  return (
    <div className="mobile-screen mypage-screen mypage-subpage">
      <MyPageHeader title="내 반려동물 관리" action={addButton} />
      <main className="pet-grid">
        {isLoading && <p className="mypage-status">반려동물을 불러오는 중...</p>}
        {!isLoading && !error && pets.length === 0 && (
          <p className="mypage-status">등록된 반려동물이 없습니다.</p>
        )}
        {error && <p className="mypage-status mypage-status--error" role="alert">{error}</p>}
        {sortedPets.map((pet) => (
          <article
            className={isPrimaryPet(pet) ? 'pet-card pet-card--primary' : 'pet-card'}
            key={pet.petId}
          >
            <button
              className="pet-card__edit"
              type="button"
              onClick={() => navigate(`/mypage/pets/${pet.petId}/edit`)}
            >
              <PetCardImage imageUrl={pet.profileImageUrl} name={pet.name} />
              <strong>{pet.name}</strong>
              {pet.size && (
                <span className="pet-card__size">
                  {PET_SIZE_LABELS[pet.size] || pet.size}
                </span>
              )}
            </button>
            {isPrimaryPet(pet) && (
              <span className="pet-primary-badge">대표 반려동물</span>
            )}
          </article>
        ))}
      </main>
      <BottomNavigation />
    </div>
  );
}
