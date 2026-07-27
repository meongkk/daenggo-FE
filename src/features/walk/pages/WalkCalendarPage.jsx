import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWalkCalendar, startWalk } from '../api/walkApi';
import BottomNavigation from '../../../components/BottomNavigation';
import './Walk.css';
import pawImage from '../../../assets/icons/paw.png';
import { getWalkablePets } from '../api/walkablePetApi';
import {
    getGroupWalks,
    getMyGroups,
} from '../../group/api/groupApi';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 달력 첫 주의 월요일부터 6주(42칸)를 만들어 월이 바뀌어도 크기가 흔들리지 않게 합니다.
function createCalendarDays(monthDate) {
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const calendarStart = new Date(firstDay);
    calendarStart.setDate(firstDay.getDate() - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(calendarStart);
        date.setDate(calendarStart.getDate() + index);
        return date;
    });
}

export default function WalkCalendarPage() {
    const navigate = useNavigate();
    const [monthDate, setMonthDate] = useState(() => new Date());
    const [walkablePets, setWalkablePets] = useState([]);
    const [isPetLoading, setIsPetLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        async function loadWalkablePets() {
            try {
                setIsPetLoading(true);

                const pets = await getWalkablePets({
                    signal: controller.signal,
                });

                if (!controller.signal.aborted) {
                    setWalkablePets(pets);
                }
            } catch (error) {
                if (error.code !== 'ERR_CANCELED') {
                    console.error('산책 가능한 반려동물 조회 실패', error);
                    setWalkablePets([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsPetLoading(false);
                }
            }
        }

        loadWalkablePets();
        return () => controller.abort();
    }, []);

    
    async function handleStartWalk() {
        try {
            const data = await startWalk();

            const walkRecordId = data?.walkRecordId;

            if (!walkRecordId) {
                throw new Error('산책 기록 ID가 없습니다.');
            }

            navigate(`/walk/tracking/${walkRecordId}`);

        } catch (error) {
            console.error(error);
            alert('산책을 시작할 수 없습니다.');
        }
    }
    const [walkDates, setWalkDates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;
    const calendarDays = useMemo(() => createCalendarDays(monthDate), [monthDate]);
    const walkDateKeys = useMemo(
        () => new Set(walkDates.map(item => item.walkDate)),
        [walkDates]
    );

    useEffect(() => {
        const controller = new AbortController();

        async function loadCalendar() {
            try {
                setIsLoading(true);
                setErrorMessage('');
                const [calendarData, groups] = await Promise.all([
                    getWalkCalendar(year, month),
                    getMyGroups({ signal: controller.signal }),
                ]);
                const myWalks = calendarData.walks ?? [];
                const monthKey = `${year}-${String(month).padStart(2, '0')}`;
                const groupWalkLists = await Promise.all(
                    groups.map(async (group) => {
                        try {
                            return await getGroupWalks(group.groupId, {
                                signal: controller.signal,
                            });
                        } catch (error) {
                            if (error.code === 'ERR_CANCELED') {
                                throw error;
                            }

                            console.error(
                                `${group.name} 그룹 산책 기록 조회 실패`,
                                error,
                            );
                            return [];
                        }
                    }),
                );
                const groupWalkDates = groupWalkLists
                    .flat()
                    .filter((walk) => walk.startedAt?.startsWith(monthKey))
                    .map((walk) => ({
                        walkRecordId: walk.walkRecordId,
                        walkDate: walk.startedAt.slice(0, 10),
                    }));

                if (!controller.signal.aborted) {
                    setWalkDates([...myWalks, ...groupWalkDates]);
                }
            } catch (error) {
                if (error.code !== 'ERR_CANCELED') {
                    setWalkDates([]);
                    setErrorMessage(
                        error.response?.data?.message
                        ?? '백엔드 연결 전이라 산책 날짜를 불러오지 못했어요.',
                    );
                }
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }

        loadCalendar();
        return () => controller.abort();
    }, [year, month]);

    function changeMonth(amount) {
        setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
    }

    return (
        <main className="walk-mobile-container">
            <header className="walk-header">산책</header>

            <section className="walk-calendar-content" aria-label={`${year}년 ${month}월 산책 달력`}>
                <div className="walk-month-toolbar">
                    <button type="button" onClick={() => changeMonth(-1)} aria-label="이전 달">‹</button>
                    <strong>{year}년 {month}월</strong>
                    <button type="button" onClick={() => changeMonth(1)} aria-label="다음 달">›</button>
                </div>

                <div className="walk-weekdays" aria-hidden="true">
                    {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
                </div>

                <div className="walk-calendar-grid">
                    {calendarDays.map((date) => {
                        const dateKey = toDateKey(date);
                        const isCurrentMonth = date.getMonth() === monthDate.getMonth();
                        const hasWalk = walkDateKeys.has(dateKey);

                        return (
                            <div
                                key={dateKey}
                                className={`walk-calendar-day ${isCurrentMonth ? '' : 'outside'} ${hasWalk ? 'has-walk' : ''}`}
                                aria-label={`${dateKey}${hasWalk ? ', 산책 기록 있음' : ''}`}
                                onClick={() => {
                                    if (!hasWalk) return;

                                    console.log('선택된 산책:', dateKey);
                                    
                                    navigate(`/walk/list/${dateKey}`);
                                }}
                            >
                                {hasWalk && (
                                    <img
                                        src={pawImage}
                                        className="walk-paw-marker"
                                        alt="산책 기록 있음"
                                    />
                                )}

                                <span className="walk-day-number">
                                    {String(date.getDate()).padStart(2, '0')}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="walk-calendar-status" aria-live="polite">
                    {isLoading && <p>산책 기록을 불러오는 중이에요.</p>}
                    {!isLoading && errorMessage && <p className="walk-error-message">{errorMessage}</p>}
                </div>
            </section>

            

            <div className="walk-primary-action-wrap">
                <button
                    type="button"
                    className="walk-primary-button"
                    onClick={handleStartWalk}
                    disabled={isPetLoading || walkablePets.length === 0}
                >
                    {isPetLoading
                    ? '반려동물 확인 중...'
                    : walkablePets.length === 0
                        ? '내 또는 그룹 반려동물 등록 후 이용 가능'
                        : '산책하기'}
                </button>
            </div>

            

            <BottomNavigation />
        </main>
    );
}
