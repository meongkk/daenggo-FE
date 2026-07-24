import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNavigation from '../../../components/navigation/BottomNavigation';
import { getApiErrorMessage } from '../../../lib/apiError';
import MyPageHeader from '../../mypage/components/MyPageHeader';
import {
  createGroup,
  getGroupDetail,
  updateGroup,
} from '../api/groupApi';
import './Group.css';

export default function GroupFormPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const isEditing = Boolean(groupId);
  const [form, setForm] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) {
      return undefined;
    }

    const controller = new AbortController();
    getGroupDetail(groupId, { signal: controller.signal })
      .then((group) => {
        if (group.myRole !== 'OWNER') {
          navigate(`/mypage/groups/${groupId}`, { replace: true });
          return;
        }
        setForm({
          name: group.name || '',
          description: group.description || '',
        });
      })
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(getApiErrorMessage(requestError, '그룹 정보를 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [groupId, isEditing, navigate]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('그룹명을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const request = {
        name: form.name.trim(),
        description: form.description.trim() || null,
      };
      const group = isEditing
        ? await updateGroup(groupId, request)
        : await createGroup(request);
      navigate(`/mypage/groups/${group.groupId}`, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, '그룹 정보를 저장하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mobile-screen mypage-screen mypage-subpage">
      <MyPageHeader title={isEditing ? '그룹 정보 수정' : '새 그룹 만들기'} />
      <main className="group-form-wrap">
        {isLoading ? (
          <p className="group-status">그룹 정보를 불러오는 중...</p>
        ) : (
          <form className="auth-form auth-signup-form" onSubmit={handleSubmit}>
            <label className="auth-field" htmlFor="group-name">
              <span>그룹명 *</span>
              <input id="group-name" value={form.name} onChange={updateField('name')} maxLength={100} disabled={isSubmitting} />
            </label>
            <label className="auth-field" htmlFor="group-description">
              <span>그룹 설명</span>
              <textarea id="group-description" value={form.description} onChange={updateField('description')} maxLength={500} rows={6} disabled={isSubmitting} />
              <small>{form.description.length}/500</small>
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : isEditing ? '수정 완료' : '그룹 만들기'}
            </button>
          </form>
        )}
      </main>
      <BottomNavigation active="mypage" />
    </div>
  );
}
