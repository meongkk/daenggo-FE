import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../../../components/BottomNavigation';
import AppIcon from '../../../components/ui/AppIcon';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
  getMyPets,
  setPrimaryPet,
} from '../../pet/api/petApi';
import useProfileImageSource from '../../profile/hooks/useProfileImageSource';
import EmptyImage from '../components/EmptyImage';
import MyPageHeader from '../components/MyPageHeader';
import './MyPage.css';

function PetCardImage({ imageUrl, name }) {
  const imageSource = useProfileImageSource(imageUrl);

  return imageSource
    ? <img src={imageSource} alt={`${name} 프로필`} />
    : <EmptyImage />;
}

export default function PetsPage() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [primarySubmittingId, setPrimarySubmittingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getMyPets({ signal: controller.signal })
      .then(setPets)
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(getApiErrorMessage(requestError, '반려동물 목록을 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const handleSetPrimary = async (event, petId) => {
    event.stopPropagation();
    try {
      setPrimarySubmittingId(petId);
      setError('');
      await setPrimaryPet(petId);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, '대표 반려동물로 지정하지 못했습니다.'));
    } finally {
      setPrimarySubmittingId(null);
    }
  };

  const addButton = (
    <button className="mypage-add-button" type="button" onClick={() => navigate('/mypage/pets/new')}><AppIcon name="plus" size={18} /> 추가하기</button>
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
        {pets.map((pet) => (
          <article className="pet-card" key={pet.petId}>
            <button
              className="pet-card__edit"
              type="button"
              onClick={() => navigate(`/mypage/pets/${pet.petId}/edit`)}
            >
              <PetCardImage imageUrl={pet.profileImageUrl} name={pet.name} />
              <strong>{pet.name}</strong>
            </button>
            <button
              className="pet-primary-button"
              type="button"
              onClick={(event) => handleSetPrimary(event, pet.petId)}
              disabled={primarySubmittingId !== null}
            >
              {primarySubmittingId === pet.petId ? '설정 중...' : '대표로 설정'}
            </button>
          </article>
        ))}
      </main>
      <BottomNavigation />
    </div>
  );
}
