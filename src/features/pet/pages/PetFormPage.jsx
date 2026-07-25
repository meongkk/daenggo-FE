import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNavigation from '../../../components/BottomNavigation';
import { getApiErrorMessage } from '../../../lib/apiError';
import MyPageHeader from '../../mypage/components/MyPageHeader';
import {
  PROFILE_IMAGE_MAX_SIZE,
  PROFILE_IMAGE_TYPES,
  uploadPetImage,
} from '../../profile/api/profileImageApi';
import useProfileImageSource from '../../profile/hooks/useProfileImageSource';
import {
  createPet,
  deletePet,
  getMyPet,
  setPrimaryPet,
  updatePet,
} from '../api/petApi';
import '../../mypage/pages/MyPage.css';

const EMPTY_FORM = {
  name: '',
  breedId: '',
  breedText: '',
  weight: '',
  size: '',
  profileImageUrl: '',
  registrationNumber: '',
  vaccine: '',
  primary: false,
};

export default function PetFormPage() {
  const navigate = useNavigate();
  const { petId } = useParams();
  const isEditing = Boolean(petId);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [initialPrimary, setInitialPrimary] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const storedImageSource = useProfileImageSource(form.profileImageUrl);
  const selectedImagePreview = useMemo(
    () => selectedImageFile ? URL.createObjectURL(selectedImageFile) : '',
    [selectedImageFile],
  );

  useEffect(() => (
    () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    }
  ), [selectedImagePreview]);

  useEffect(() => {
    if (!isEditing) {
      return undefined;
    }

    const controller = new AbortController();
    getMyPet(petId, { signal: controller.signal })
      .then((pet) => {
        const isPrimary = Boolean(pet.primary);
        setForm({
          name: pet.name || '',
          breedId: pet.breedId || '',
          breedText: pet.breedText || pet.breedName || '',
          weight: pet.weight ?? '',
          size: pet.size || '',
          profileImageUrl: pet.profileImageUrl || '',
          registrationNumber: pet.registrationNumber || '',
          vaccine: pet.vaccine || '',
          primary: isPrimary,
        });
        setInitialPrimary(isPrimary);
      })
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(getApiErrorMessage(requestError, '반려동물 정보를 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [isEditing, petId]);

  const updateField = (field) => (event) => {
    const value = event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value;
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'breedText' ? { breedId: '' } : {}),
    }));
    setError('');
  };

  const handleProfileImageChange = (event) => {
    const imageFile = event.target.files?.[0];
    event.target.value = '';

    if (!imageFile) {
      return;
    }
    if (!PROFILE_IMAGE_TYPES.includes(imageFile.type)) {
      setError('JPG, PNG, GIF, WEBP 형식의 이미지만 등록할 수 있습니다.');
      return;
    }
    if (imageFile.size > PROFILE_IMAGE_MAX_SIZE) {
      setError('이미지는 10MB 이하만 등록할 수 있습니다.');
      return;
    }

    setSelectedImageFile(imageFile);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.weight || Number(form.weight) <= 0 || !form.size.trim()) {
      setError('이름, 몸무게, 크기를 올바르게 입력해주세요.');
      return;
    }

    const breedText = form.breedText.trim();
    const petRequest = {
      name: form.name.trim(),
      breedId: form.breedId ? Number(form.breedId) : null,
      breedText: form.breedId ? null : breedText || null,
      weight: Number(form.weight),
      size: form.size.trim(),
      registrationNumber: form.registrationNumber.trim(),
      vaccine: form.vaccine.trim(),
    };

    try {
      setIsSubmitting(true);
      setError('');
      const profileImageUrl = selectedImageFile
        ? await uploadPetImage(selectedImageFile)
        : form.profileImageUrl.trim();
      const commonRequest = {
        ...petRequest,
        ...(profileImageUrl ? { profileImageUrl } : {}),
      };

      if (isEditing) {
        await updatePet(petId, commonRequest);
        if (form.primary && !initialPrimary) {
          await setPrimaryPet(petId);
        }
      } else {
        await createPet({ ...commonRequest, primary: form.primary });
      }
      navigate('/mypage/pets', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, '반려동물 정보를 저장하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('이 반려동물을 삭제하시겠어요?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await deletePet(petId);
      navigate('/mypage/pets', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, '반려동물을 삭제하지 못했습니다.'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-screen mypage-screen mypage-subpage">
      <MyPageHeader title={isEditing ? '반려동물 정보 수정' : '반려동물 등록'} />
      <main className="profile-edit-content">
        {isLoading ? (
          <p className="mypage-status">반려동물 정보를 불러오는 중...</p>
        ) : (
          <form className="auth-form auth-signup-form pet-form" onSubmit={handleSubmit}>
            <label className="auth-field" htmlFor="pet-name">
              <span>이름 *</span>
              <input id="pet-name" value={form.name} onChange={updateField('name')} maxLength={50} disabled={isSubmitting} />
            </label>
            <label className="auth-field" htmlFor="pet-breed">
              <span>견종</span>
              <input id="pet-breed" value={form.breedText} onChange={updateField('breedText')} maxLength={50} placeholder="직접 입력" disabled={isSubmitting} />
            </label>
            <label className="auth-field" htmlFor="pet-weight">
              <span>몸무게(kg) *</span>
              <input id="pet-weight" type="number" min="0.01" max="999.99" step="0.01" value={form.weight} onChange={updateField('weight')} disabled={isSubmitting} />
            </label>
            <label className="auth-field" htmlFor="pet-size">
              <span>크기 *</span>
              <input id="pet-size" value={form.size} onChange={updateField('size')} maxLength={20} placeholder="예: 소형" disabled={isSubmitting} />
            </label>
            <label className="auth-field" htmlFor="pet-registration">
              <span>동물등록번호</span>
              <input id="pet-registration" value={form.registrationNumber} onChange={updateField('registrationNumber')} maxLength={50} disabled={isSubmitting} />
            </label>
            <label className="auth-field" htmlFor="pet-vaccine">
              <span>예방접종 정보</span>
              <input id="pet-vaccine" value={form.vaccine} onChange={updateField('vaccine')} maxLength={50} disabled={isSubmitting} />
            </label>
            <div className="profile-image-field">
              <span>프로필 이미지</span>
              {(selectedImagePreview || storedImageSource) && (
                <img
                  className="profile-image-preview"
                  src={selectedImagePreview || storedImageSource}
                  alt={`${form.name || '반려동물'} 프로필 미리보기`}
                />
              )}
              <label className="profile-image-select-button" htmlFor="pet-image">
                이미지 선택
              </label>
              <input
                id="pet-image"
                className="sr-only"
                type="file"
                accept={PROFILE_IMAGE_TYPES.join(',')}
                onChange={handleProfileImageChange}
                disabled={isSubmitting}
              />
              <small>JPG, PNG, GIF, WEBP · 최대 10MB</small>
              {selectedImageFile && <small>선택 파일: {selectedImageFile.name}</small>}
            </div>
            <label className="pet-primary-check">
              <input
                type="checkbox"
                checked={form.primary}
                onChange={updateField('primary')}
                disabled={isSubmitting || (isEditing && initialPrimary)}
              />
              {isEditing && initialPrimary
                ? '현재 대표 반려동물'
                : '대표 반려동물로 설정'}
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
            {isEditing && (
              <button className="danger-outline-button" type="button" onClick={handleDelete} disabled={isSubmitting}>
                반려동물 삭제
              </button>
            )}
          </form>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
}
