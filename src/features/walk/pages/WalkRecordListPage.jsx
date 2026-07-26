import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApiErrorMessage } from '../../../lib/apiError';
import {
    getGroupWalks,
    getMyGroups,
} from '../../group/api/groupApi';
import { getWalkCalendar } from '../api/walkApi';
import './Walk.css';

function formatDuration(durationSec) {
    if (durationSec == null) {
        return '-';
    }

    const hours = Math.floor(durationSec / 3600);
    const minutes = Math.floor((durationSec % 3600) / 60);

    return hours > 0
        ? `${hours}시간 ${minutes}분`
        : `${minutes}분`;
}

function formatDistance(distanceM) {
    if (distanceM == null) {
        return '-';
    }

    return distanceM >= 1000
        ? `${(distanceM / 1000).toFixed(2)}km`
        : `${Math.round(distanceM)}m`;
}

function formatStartedAt(startedAt) {
    if (!startedAt) {
        return '-';
    }

    const [datePart, timePart = ''] = startedAt.split('T');
    return `${datePart.replaceAll('-', '.')} ${timePart.slice(0, 5)}`.trim();
}

export default function WalkRecordListPage() {
    const navigate = useNavigate();
    const { date } = useParams();
    const [walks, setWalks] = useState([]);
    const [groupWalkSections, setGroupWalkSections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        async function loadWalks() {
            try {
                setIsLoading(true);
                setError('');

                const [year, month] = date.split('-');
                const [calendarData, groups] = await Promise.all([
                    getWalkCalendar(Number(year), Number(month)),
                    getMyGroups({ signal: controller.signal }),
                ]);
                const myWalks = (calendarData.walks ?? []).filter(
                    (walk) => walk.walkDate === date,
                );
                const myWalkIds = new Set(
                    myWalks.map((walk) => Number(walk.walkRecordId)),
                );
                const sections = await Promise.all(
                    groups.map(async (group) => {
                        try {
                            const groupWalks = await getGroupWalks(group.groupId, {
                                signal: controller.signal,
                            });
                            return {
                                groupId: group.groupId,
                                groupName: group.name,
                                walks: groupWalks.filter(
                                    (walk) =>
                                        walk.startedAt?.slice(0, 10) === date
                                        && !myWalkIds.has(Number(walk.walkRecordId)),
                                ),
                                error: '',
                            };
                        } catch (requestError) {
                            if (requestError.code === 'ERR_CANCELED') {
                                throw requestError;
                            }

                            return {
                                groupId: group.groupId,
                                groupName: group.name,
                                walks: [],
                                error: requestError.response?.data?.detail
                                    ?? getApiErrorMessage(
                                        requestError,
                                        '그룹 산책 기록을 불러오지 못했습니다.',
                                    ),
                            };
                        }
                    }),
                );

                if (!controller.signal.aborted) {
                    setWalks(myWalks);
                    setGroupWalkSections(sections);
                }
            } catch (requestError) {
                if (requestError.code !== 'ERR_CANCELED') {
                    setWalks([]);
                    setGroupWalkSections([]);
                    setError(
                        requestError.response?.data?.detail
                            ?? getApiErrorMessage(
                                requestError,
                                '산책 기록을 불러오지 못했습니다.',
                            ),
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        loadWalks();
        return () => controller.abort();
    }, [date]);

    return (
        <main className="walk-mobile-container">
            <header className="walk-header">
                <button
                    className="walk-header-back"
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="이전 화면으로 이동"
                >
                    ‹
                </button>
                {date} 산책 기록
            </header>

            <section className="walk-record-page">
                {isLoading && (
                    <p className="walk-record-status">산책 기록을 불러오는 중...</p>
                )}
                {!isLoading && error && (
                    <p className="walk-record-status walk-record-status--error" role="alert">
                        {error}
                    </p>
                )}

                {!isLoading && !error && (
                    <>
                        <section className="walk-record-own">
                            <h2>내 산책 <span>{walks.length}</span></h2>
                            {walks.length === 0 ? (
                                <p className="walk-record-empty">이 날짜의 내 산책 기록이 없습니다.</p>
                            ) : (
                                walks.map((walk) => (
                                    <button
                                        key={walk.walkRecordId}
                                        type="button"
                                        className="walk-record-card"
                                        onClick={() => navigate(`/walk/${walk.walkRecordId}`)}
                                    >
                                        <h3>{walk.title || '산책 기록'}</h3>
                                        <p>{walk.memo || '메모 없음'}</p>
                                    </button>
                                ))
                            )}
                        </section>

                        <section className="group-walk-records">
                            <h2>그룹원 산책</h2>
                            {groupWalkSections.length === 0 ? (
                                <p className="walk-record-empty">참여 중인 그룹이 없습니다.</p>
                            ) : (
                                groupWalkSections.map((section) => (
                                    <section
                                        className="group-walk-section"
                                        key={section.groupId}
                                    >
                                        <div className="group-walk-section__heading">
                                            <h3>{section.groupName}</h3>
                                            <span>{section.walks.length}개</span>
                                        </div>

                                        {section.error ? (
                                            <p className="walk-record-status walk-record-status--error">
                                                {section.error}
                                            </p>
                                        ) : section.walks.length === 0 ? (
                                            <p className="group-walk-empty">
                                                이 날짜의 그룹원 산책 기록이 없습니다.
                                            </p>
                                        ) : (
                                            section.walks.map((walk) => {
                                                const petNames = walk.pets
                                                    ?.map((pet) => pet.name)
                                                    .join(', ');

                                                return (
                                                    <article
                                                        className="group-walk-card"
                                                        key={walk.walkRecordId}
                                                    >
                                                        <div className="group-walk-card__owner">
                                                            <strong>{walk.ownerNickname}</strong>
                                                            <span>{petNames || '반려동물 정보 없음'}</span>
                                                        </div>
                                                        <h4>{walk.title || '산책 기록'}</h4>
                                                        {walk.memo && <p>{walk.memo}</p>}
                                                        <div className="group-walk-card__meta">
                                                            <span>{formatStartedAt(walk.startedAt)}</span>
                                                            <span>
                                                                {formatDistance(walk.distanceM)}
                                                                {' · '}
                                                                {formatDuration(walk.durationSec)}
                                                            </span>
                                                        </div>
                                                    </article>
                                                );
                                            })
                                        )}
                                    </section>
                                ))
                            )}
                        </section>
                    </>
                )}
            </section>

            <div className="walk-primary-action-wrap">
                <button
                    className="walk-primary-button"
                    type="button"
                    onClick={() => navigate('/walk')}
                >
                    확인
                </button>
            </div>
        </main>
    );
}
