import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNavigation from '../../../components/BottomNavigation';
import AppIcon from '../../../components/ui/AppIcon';
import { getApiErrorMessage } from '../../../lib/apiError';
import MyPageHeader from '../../mypage/components/MyPageHeader';
import ProfileAvatar from '../../mypage/components/ProfileAvatar';
import { searchUsers } from '../../user/api/userApi';
import {
  addGroupMember,
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
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [addingUserId, setAddingUserId] = useState(null);

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

  useEffect(() => {
    if (!isAddMemberOpen) {
      return undefined;
    }

    const nickname = searchQuery.trim();
    if (!nickname) {
      setSearchResults([]);
      setHasSearched(false);
      setSearchError('');
      setIsSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const timerId = window.setTimeout(() => {
      setIsSearching(true);
      setSearchError('');

      searchUsers(nickname, { signal: controller.signal })
        .then((users) => {
          setSearchResults(users);
          setHasSearched(true);
        })
        .catch((requestError) => {
          if (requestError.code !== 'ERR_CANCELED') {
            setSearchResults([]);
            setHasSearched(true);
            setSearchError(
              requestError.response?.data?.detail
                ?? getApiErrorMessage(requestError, '사용자 검색에 실패했습니다.'),
            );
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearching(false);
          }
        });
    }, 400);

    return () => {
      window.clearTimeout(timerId);
      controller.abort();
    };
  }, [isAddMemberOpen, searchQuery]);

  const openAddMemberModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setSearchError('');
    setAddingUserId(null);
    setIsAddMemberOpen(true);
  };

  const closeAddMemberModal = () => {
    if (addingUserId !== null) {
      return;
    }
    setIsAddMemberOpen(false);
  };

  const handleAddMember = async (user) => {
    if (!window.confirm(`${user.nickname}님을 그룹원으로 추가하시겠어요?`)) {
      return;
    }

    try {
      setAddingUserId(user.userId);
      setSearchError('');
      await addGroupMember(groupId, user.userId);
      await loadGroup();
      setIsAddMemberOpen(false);
    } catch (requestError) {
      const status = requestError.response?.status;
      const statusMessage = {
        400: '본인을 그룹원으로 추가할 수 없습니다.',
        401: '다시 로그인해 주세요.',
        403: '그룹장만 그룹원을 추가할 수 있습니다.',
        404: '해당 회원을 찾을 수 없습니다.',
        409: '이미 참여 중인 그룹원입니다.',
      }[status];

      setSearchError(
        requestError.response?.data?.detail
          ?? statusMessage
          ?? '그룹원 추가에 실패했습니다.',
      );
    } finally {
      setAddingUserId(null);
    }
  };

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
        <BottomNavigation />
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
              <div className="group-members__heading">
                <h3>그룹원</h3>
                {group.myRole === 'OWNER' && (
                  <button type="button" onClick={openAddMemberModal}>
                    <AppIcon name="plus" size={15} />
                    그룹원 추가
                  </button>
                )}
              </div>
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
      <BottomNavigation />

      {isAddMemberOpen && (
        <div
          className="group-member-modal-overlay"
          role="presentation"
          onMouseDown={closeAddMemberModal}
        >
          <section
            className="group-member-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-member-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2 id="group-member-modal-title">그룹원 추가</h2>
                <p>추가할 사용자의 닉네임을 검색해 주세요.</p>
              </div>
              <button
                type="button"
                className="group-member-modal__close"
                onClick={closeAddMemberModal}
                disabled={addingUserId !== null}
                aria-label="그룹원 추가 창 닫기"
              >
                ×
              </button>
            </header>

            <label className="group-member-search" htmlFor="group-member-search">
              <span className="sr-only">사용자 닉네임</span>
              <input
                id="group-member-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="닉네임을 입력해 주세요"
                maxLength={50}
                disabled={addingUserId !== null}
                autoFocus
              />
            </label>

            <div className="group-member-search__results">
              {!searchQuery.trim() && (
                <p className="group-member-search__guide">
                  닉네임 일부만 입력해도 검색할 수 있습니다.
                </p>
              )}
              {isSearching && <p className="group-member-search__guide">검색 중...</p>}
              {searchError && (
                <p className="group-member-search__error" role="alert">{searchError}</p>
              )}
              {!isSearching && !searchError && hasSearched && searchResults.length === 0 && (
                <p className="group-member-search__guide">검색 결과가 없습니다.</p>
              )}
              {!searchError && searchResults.map((user) => {
                const isExistingMember = members.some(
                  (member) => Number(member.userId) === Number(user.userId),
                );

                return (
                  <article className="group-member-search__item" key={user.userId}>
                    <ProfileAvatar
                      imageUrl={user.profileImageUrl}
                      nickname={user.nickname}
                      size="small"
                    />
                    <strong>{user.nickname}</strong>
                    <button
                      type="button"
                      onClick={() => handleAddMember(user)}
                      disabled={isExistingMember || addingUserId !== null}
                    >
                      {isExistingMember
                        ? '참여 중'
                        : addingUserId === user.userId
                          ? '추가 중...'
                          : '추가'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
