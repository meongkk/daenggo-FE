import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWalkCalendar, startWalk } from '../api/walkApi';
import BottomNavigation from '../../../components/BottomNavigation';
import './Walk.css';
import pawImage from '../../../assets/icons/paw.png';
import { getMyPets } from '../../pet/api/petApi';

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
    const [myPets, setMyPets] = useState([]);
    const [isPetLoading, setIsPetLoading] = useState(true);

    useEffect(() => {
        async function loadMyPets() {
            try {
                setIsPetLoading(true);
    
                const pets = await getMyPets();
    
                setMyPets(pets);
    
            } catch (error) {
                console.error('반려동물 조회 실패', error);
                setMyPets([]);
            } finally {
                setIsPetLoading(false);
            }
        }
    
        loadMyPets();
    
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

    const walkMap = useMemo(() => {
        const map = new Map();
    
        walkDates.forEach(item => {
            map.set(
                item.walkDate,
                [
                ...(map.get(item.walkDate) ?? []),
                item.walkRecordId
                ]
            );
        });
    
        return map;
    }, [walkDates]);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadCalendar() {
            try {
                setIsLoading(true);
                setErrorMessage('');
                const data = await getWalkCalendar(year, month);

                console.log(data);
                
                const walks = data.walks ?? [];
                console.log(walkDates);

                if (isCurrentRequest) {
                    setWalkDates(walks);
                }
            } catch (error) {
                if (isCurrentRequest) {
                    setWalkDates([]);
                    setErrorMessage(
                        error.response?.data?.message
                        ?? '백엔드 연결 전이라 산책 날짜를 불러오지 못했어요.',
                    );
                }
            } finally {
                if (isCurrentRequest) setIsLoading(false);
            }
        }

        loadCalendar();
        return () => { isCurrentRequest = false; };
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
                                    // const walks = walkMap.get(dateKey);

                                    // setSelectedWalks(walks);
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
                    disabled={isPetLoading || myPets.length === 0}
                >
                    {isPetLoading
                    ? '반려동물 확인 중...'
                    : myPets.length === 0
                        ? '반려동물 등록 후 이용 가능'
                        : '산책 등록하기'}
                </button>
            </div>

            

            <BottomNavigation />
        </main>
    );
}
