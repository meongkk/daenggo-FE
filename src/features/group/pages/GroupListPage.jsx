import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '../../../components/navigation/BottomNavigation';
import AppIcon from '../../../components/ui/AppIcon';
import { getApiErrorMessage } from '../../../lib/apiError';
import MyPageHeader from '../../mypage/components/MyPageHeader';
import { getMyGroups } from '../api/groupApi';
import './Group.css';

export default function GroupListPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    getMyGroups({ signal: controller.signal })
      .then(setGroups)
      .catch((requestError) => {
        if (requestError.code !== 'ERR_CANCELED') {
          setError(getApiErrorMessage(requestError, '그룹 목록을 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const createButton = (
    <button className="mypage-add-button" type="button" onClick={() => navigate('/mypage/groups/new')}>
      <AppIcon name="plus" size={18} /> 그룹 만들기
    </button>
  );

  return (
    <div className="mobile-screen mypage-screen mypage-subpage">
      <MyPageHeader title="그룹 관리" action={createButton} />
      <main className="group-list">
        {isLoading && <p className="group-status">그룹을 불러오는 중...</p>}
        {!isLoading && !error && groups.length === 0 && (
          <div className="group-empty">
            <strong>참여 중인 그룹이 없습니다.</strong>
            <span>새 그룹을 만들어 함께 활동해보세요.</span>
          </div>
        )}
        {error && <p className="group-status group-status--error" role="alert">{error}</p>}
        {groups.map((group) => (
          <button
            className="group-card"
            key={group.groupId}
            type="button"
            onClick={() => navigate(`/mypage/groups/${group.groupId}`)}
          >
            <div>
              <strong>{group.name}</strong>
              <span className={`group-role group-role--${group.myRole.toLowerCase()}`}>
                {group.myRole === 'OWNER' ? '그룹장' : '그룹원'}
              </span>
            </div>
            <p>{group.description || '그룹 설명이 없습니다.'}</p>
            <small>그룹원 {group.memberCount}명</small>
          </button>
        ))}
      </main>
      <BottomNavigation active="mypage" />
    </div>
  );
}
