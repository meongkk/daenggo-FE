import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNavigation from '../../../components/navigation/BottomNavigation';
import { getApiErrorMessage } from '../../../lib/apiError';
import MyPageHeader from '../../mypage/components/MyPageHeader';
import ProfileAvatar from '../../mypage/components/ProfileAvatar';
import {
  getGroupDetail,
  getGroupMembers,
  kickMember,
  leaveGroup,
  transferOwnership,
} from '../api/groupApi';
import './Group.css';

export default function GroupDetailPage() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  const loadGroup = useCallback(async (signal) => {
    const [groupDetail, groupMembers] = await Promise.all([
      getGroupDetail(groupId, { signal }),
      getGroupMembers(groupId, { signal }),
    ]);
    setGroup(groupDetail);
    setMembers(groupMembers);
  }, [groupId]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    loadGroup(controller.signal)
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
  }, [loadGroup, requestKey]);

  const runMemberAction = async (name, member, action) => {
    const confirmation = name === 'transfer'
      ? `${member.nickname}님에게 그룹장 권한을 양도하시겠어요?`
      : `${member.nickname}님을 그룹에서 내보내시겠어요?`;
    const failureMessage = name === 'transfer'
      ? '그룹장 권한을 양도하지 못했습니다.'
      : '그룹원을 내보내지 못했습니다.';
    if (!window.confirm(confirmation)) {
      return;
    }

    try {
      setActionId(`${name}-${member.memberId}`);
      setError('');
      await action();
      setRequestKey((key) => key + 1);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, failureMessage));
    } finally {
      setActionId('');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('이 그룹에서 탈퇴하시겠어요?')) {
      return;
    }

    try {
      setActionId('leave');
      setError('');
      await leaveGroup(groupId);
      navigate('/mypage/groups', { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.status === 409
          ? '그룹장은 권한을 양도한 뒤 탈퇴할 수 있습니다.'
          : getApiErrorMessage(requestError, '그룹에서 탈퇴하지 못했습니다.'),
      );
      setActionId('');
    }
  };

  if (isLoading) {
    return (
      <div className="mobile-screen mypage-screen mypage-subpage">
        <MyPageHeader title="그룹 상세" />
        <p className="group-status">그룹 정보를 불러오는 중...</p>
        <BottomNavigation active="mypage" />
      </div>
    );
  }

  return (
    <div className="mobile-screen mypage-screen mypage-subpage">
      <MyPageHeader title="그룹 상세" />
      <main className="group-detail">
        {error && <p className="group-status group-status--error" role="alert">{error}</p>}
        {group && (
          <>
            <section className="group-detail__summary">
              <div>
                <h2>{group.name}</h2>
                <span className={`group-role group-role--${group.myRole.toLowerCase()}`}>
                  {group.myRole === 'OWNER' ? '그룹장' : '그룹원'}
                </span>
              </div>
              <p>{group.description || '그룹 설명이 없습니다.'}</p>
              <small>그룹장 {group.ownerNickname} · 그룹원 {group.memberCount}명</small>
              {group.myRole === 'OWNER' && (
                <button type="button" className="group-link-button" onClick={() => navigate(`/mypage/groups/${groupId}/edit`)}>
                  그룹 정보 수정
                </button>
              )}
            </section>

            <section className="group-members">
              <h3>그룹원</h3>
              {members.map((member) => (
                <article key={member.memberId} className="group-member">
                  <ProfileAvatar imageUrl={member.profileImageUrl} nickname={member.nickname} size="small" />
                  <div className="group-member__info">
                    <strong>{member.nickname}</strong>
                    <span>{member.role === 'OWNER' ? '그룹장' : '그룹원'}</span>
                  </div>
                  {group.myRole === 'OWNER' && member.role === 'MEMBER' && (
                    <div className="group-member__actions">
                      <button
                        type="button"
                        onClick={() => runMemberAction(
                          'transfer',
                          member,
                          () => transferOwnership(groupId, member.memberId),
                        )}
                        disabled={Boolean(actionId)}
                      >
                        {actionId === `transfer-${member.memberId}` ? '처리 중' : '권한 양도'}
                      </button>
                      <button
                        type="button"
                        className="is-danger"
                        onClick={() => runMemberAction(
                          'kick',
                          member,
                          () => kickMember(groupId, member.memberId),
                        )}
                        disabled={Boolean(actionId)}
                      >
                        {actionId === `kick-${member.memberId}` ? '처리 중' : '내보내기'}
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </section>

            <section className="group-danger-zone">
              {group.myRole === 'MEMBER' ? (
                <button type="button" onClick={handleLeave} disabled={Boolean(actionId)}>
                  {actionId === 'leave' ? '탈퇴 중...' : '그룹 탈퇴'}
                </button>
              ) : (
                <>
                  <button type="button" disabled>그룹 삭제</button>
                  <small>백엔드 삭제 기능 안정화 후 사용할 수 있습니다.</small>
                </>
              )}
            </section>
          </>
        )}
      </main>
      <BottomNavigation active="mypage" />
    </div>
  );
}
