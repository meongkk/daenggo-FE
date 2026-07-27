import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    completeWalk,
    saveWalkTrackPoints,
    uploadWalkPhoto
} from '../api/walkApi';
import { getWalkablePets } from '../api/walkablePetApi';
import BottomNavigation from '../../../components/BottomNavigation';
import './Walk.css';
import KakaoMap from "../../../components/KakaoMap";

const GPS_BATCH_SIZE = 5;

function getDistanceInMeters(previous, current) {
    const earthRadius = 6371000;
    const toRadian = (degree) => degree * (Math.PI / 180);
    const latitudeDistance = toRadian(current.latitude - previous.latitude);
    const longitudeDistance = toRadian(current.longitude - previous.longitude);
    const startLatitude = toRadian(previous.latitude);
    const endLatitude = toRadian(current.latitude);
    const value = (
        Math.sin(latitudeDistance / 2) ** 2
        + Math.cos(startLatitude) * Math.cos(endLatitude)
        * Math.sin(longitudeDistance / 2) ** 2
    );

    return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function formatDuration(totalSeconds) {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function formatPace(elapsedSeconds, distanceM) {
    if (distanceM < 100) return `--′--″`;

    const paceSeconds = Math.round(
        elapsedSeconds / (distanceM / 1000)
    );

    const minutes = Math.floor(paceSeconds / 60);
    const seconds = String(paceSeconds % 60).padStart(2, '0');

    return `${minutes}′${seconds}″`;
}

export default function WalkTrackingPage() {
    const navigate = useNavigate();
    const { walkId } = useParams();
    const [phase, setPhase] = useState('active');
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [distanceM, setDistanceM] = useState(0);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [isLocationLoading, setIsLocationLoading] = useState(true);
    const [routePoints, setRoutePoints] = useState([]);
    const [savedPhotoUrl, setSavedPhotoUrl] = useState('');
    const [message, setMessage] = useState('현재 위치를 확인하고 있어요.');
    const [errorMessage, setErrorMessage] = useState('');
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [walkTitle, setWalkTitle] = useState('');
    const [walkMemo, setWalkMemo] = useState('');
    const [walkablePets, setWalkablePets] = useState([]);
    const [selectedPetIds, setSelectedPetIds] = useState([]);
    const [petSelectorOpen, setPetSelectorOpen] = useState(false);
    const pausedTimeRef = useRef(0);
    const pauseStartedRef = useRef(null);

    

    const timerIdRef = useRef(null);
    const gpsWatchIdRef = useRef(null);
    const lastPositionRef = useRef(null);
    const walkStartTimeRef = useRef(null);
    const sequenceRef = useRef(0);
    const gpsBufferRef = useRef([]);
    const pendingGpsRequestRef = useRef(Promise.resolve());
    const photoPreviewRef = useRef('');
    const hasStartedTimerRef = useRef(false);

    function stopDeviceTracking() {
        if (timerIdRef.current) window.clearInterval(timerIdRef.current);
        if (gpsWatchIdRef.current !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        }
        timerIdRef.current = null;
        gpsWatchIdRef.current = null;
    }

    function pauseWalkTimer() {
        if (timerIdRef.current) {
            window.clearInterval(timerIdRef.current);
            timerIdRef.current = null;
        }

        pauseStartedRef.current = Date.now();
    }
    
    
    function resumeWalkTimer() {
        if (timerIdRef.current) return;
    
        if (pauseStartedRef.current) {
            pausedTimeRef.current += Date.now() - pauseStartedRef.current;
            pauseStartedRef.current = null;
        }
    
        timerIdRef.current = window.setInterval(() => {
            setElapsedSeconds(
                Math.floor(
                    (
                        Date.now()
                        - walkStartTimeRef.current
                        - pausedTimeRef.current
                    ) / 1000
                )
            );
        }, 1000);
    }

    // 산책 시작: 타이머는 여기서 딱 한 번만 시작한다.
    // (watchPosition 콜백 안에 두면 GPS 좌표를 받을 때마다 타이머가 새로 생겨 겹치는 문제가 있었음)
    useEffect(() => {
        if (!walkId) return;

        setMessage('산책을 기록하고 있어요.');

        // walkStartTimeRef.current = Date.now();
        // timerIdRef.current = window.setInterval(() => {
        //     setElapsedSeconds(
        //         Math.floor((Date.now() - walkStartTimeRef.current) / 1000)
        //     );
        // }, 1000);

        beginDeviceTracking(Number(walkId));

        return () => {
            stopDeviceTracking();

            if (photoPreviewRef.current) {
                URL.revokeObjectURL(photoPreviewRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [walkId]);




    function queueGpsBatch(activeWalkId, points) {
        pendingGpsRequestRef.current = pendingGpsRequestRef.current
            .then(() => saveWalkTrackPoints(activeWalkId, points))
            .catch((error) => {
                setErrorMessage(
                    error.response?.data?.message
                    ?? 'GPS 좌표를 서버에 저장하지 못했어요. 백엔드 API를 확인해 주세요.',
                );
            });
    }

    useEffect(() => {
        if (!showCompleteModal) return;
        const controller = new AbortController();

        async function loadWalkablePets() {
            try {
                setErrorMessage('');

                const pets = await getWalkablePets({
                    signal: controller.signal,
                });

                if (!controller.signal.aborted) {
                    setWalkablePets(pets);
                }
            } catch (error) {
                if (error.code !== 'ERR_CANCELED') {
                    setErrorMessage(
                        error.response?.data?.message
                        ?? '산책 가능한 반려동물 목록을 불러오지 못했어요.'
                    );
                }
            }
        }

        loadWalkablePets();
        return () => controller.abort();
    }, [showCompleteModal]);
    

    // GPS 좌표 수신 전용. 시간 측정과는 분리되어 있다.
    function beginDeviceTracking(activeWalkId) {
        if (!navigator.geolocation) {
            setErrorMessage('이 브라우저는 GPS 위치 기능을 지원하지 않아요.');
            return;
        }

        gpsWatchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {

                if (!hasStartedTimerRef.current) {
                    hasStartedTimerRef.current = true;
                
                    walkStartTimeRef.current = Date.now();
                
                    resumeWalkTimer();   // 이미 만들어둔 함수 사용
                }
                
                setIsLocationLoading(false);

                console.log('GPS 들어옴', position.coords.latitude, position.coords.longitude);
                const nextPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };

                setRoutePoints((prev) => [
                    ...prev,
                    nextPosition
                ]);

                if (lastPositionRef.current) {
                    const movedDistance = getDistanceInMeters(lastPositionRef.current, nextPosition);
                    // GPS가 순간적으로 튀어 수백 m가 더해지는 것을 막기 위한 간단한 안전장치입니다.
                    if (movedDistance < 100) setDistanceM((current) => current + movedDistance);
                }

                lastPositionRef.current = nextPosition;
                setCurrentPosition(nextPosition);
                sequenceRef.current += 1;
                gpsBufferRef.current.push({
                    sequenceNo: sequenceRef.current,
                    latitude: nextPosition.latitude,
                    longitude: nextPosition.longitude,
                });

                if (gpsBufferRef.current.length >= GPS_BATCH_SIZE) {
                    const batch = gpsBufferRef.current.splice(0, GPS_BATCH_SIZE);
                    console.log("서버 전송 데이터", {
                        trackPoints: batch
                    });

                    queueGpsBatch(activeWalkId, batch);
                }
            },
            (error) => {
                const reason = error.code === error.PERMISSION_DENIED
                    ? '위치 권한이 거절됐어요. 브라우저에서 위치 권한을 허용해 주세요.'
                    : '현재 위치를 확인하지 못했어요. GPS 상태를 확인해 주세요.';
                setErrorMessage(reason);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 },
        );
    }

    async function handlePhotoChange(event) {
        const imageFile = event.target.files?.[0];
        event.target.value = '';
        if (!imageFile || !walkId) return;

        if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
        photoPreviewRef.current = URL.createObjectURL(imageFile);
        setSavedPhotoUrl(photoPreviewRef.current);

        try {
            setErrorMessage('');
            await uploadWalkPhoto(walkId, imageFile, currentPosition);
            setMessage('사진을 산책 기록에 저장했어요.');
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message
                ?? '사진 화면은 준비됐지만 백엔드 사진 API 저장에 실패했어요.',
            );
        }
    }

    function handleCompleteWalk() {
        if (!walkId) return;

        pauseWalkTimer();

        // setPhase('completing');
        setErrorMessage('');
    
        setWalkTitle(
            `${new Date().toLocaleDateString('ko-KR')} 산책`
        );

        setShowCompleteModal(true);
    }

    function togglePet(petId) {
        setSelectedPetIds((prev) => {
            if (prev.includes(petId)) {
                return prev.filter(id => id !== petId);
            }
            return [...prev, petId];
        });
    }

    async function saveCompletedWalk() {
        try {
            if (gpsBufferRef.current.length > 0) {
                const lastBatch = gpsBufferRef.current.splice(0);
                queueGpsBatch(walkId, lastBatch);
            }

            await pendingGpsRequestRef.current;

            const data = await completeWalk(
                walkId,
                {
                    title: walkTitle,
                    memo: walkMemo,
                    petIds: selectedPetIds,
                    distanceM: Number(distanceM.toFixed(2)),
                }
            );

            const completedWalkId = data?.walkRecordId ?? walkId;

            navigate(`/walk/${completedWalkId}`);
        } catch (error) {
            console.log(error);

            setPhase('active');

            resumeWalkTimer();

            setErrorMessage(
                error.response?.data?.message
                ?? '산책 저장 실패'
            );
        }
    }

    const isActive = phase === 'active';

    return (
        <main className="walk-mobile-container walk-tracking-page">
            <header className="walk-header walk-floating-header">
                <button type="button" className="walk-header-back" onClick={() => navigate('/walk')} aria-label="산책 달력으로 돌아가기">‹</button>
                산책 기록
            </header>

            <section className="walk-map-canvas" aria-label="산책 위치 지도 영역">
                {isLocationLoading ? (
                    <div className="walk-location-loading">
                        <p>📍</p>
                        <strong>현재 위치를 확인하고 있어요.</strong>
                        <span>잠시만 기다려 주세요.</span>
                    </div>
                ) : (
                    <KakaoMap
                        currentPosition={currentPosition}
                        routePoints={routePoints}
                    />
                )}

                {savedPhotoUrl && (
                    <img className="walk-map-photo-preview" src={savedPhotoUrl} alt="방금 촬영한 산책 사진" />
                )}

                <div className="walk-tracking-status">
                    <strong>{isActive ? 'GPS 기록 중' : '산책 준비'}</strong>
                    <span>{message}</span>
                </div>

                <div className="walk-live-stats">
                    <div><strong>{formatDuration(elapsedSeconds)}</strong><span>산책 시간</span></div>
                    <div><strong>{formatPace(elapsedSeconds, distanceM)}</strong><span>페이스</span></div>
                    <div><strong>{(distanceM / 1000).toFixed(2)} km</strong><span>총 거리</span></div>
                </div>

                {errorMessage && <p className="walk-map-error" role="alert">{errorMessage}</p>}

                <div className="walk-tracking-actions">
                    <label className="walk-secondary-button">
                        사진 찍기
                        <input
                            className="walk-visually-hidden"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoChange}
                        />
                    </label>

                    <button
                        type="button"
                        className="walk-primary-button"
                        onClick={handleCompleteWalk}
                        disabled={phase === 'completing'}
                    >
                        {phase === 'completing'
                            ? '저장 중...'
                            : '산책 완료하기'}
                    </button>
                </div>
            </section>

            {showCompleteModal && (
                <div className="walk-modal-overlay">
                    <div className="walk-complete-modal">

                        <button
                            className="walk-close-button"
                            onClick={() => {
                                setShowCompleteModal(false);
                                setPhase('active');
                                resumeWalkTimer();
                            }}
                        >
                            ✕
                        </button>

                        <h2>산책 기록 저장</h2>

                        
                        <input
                            value={walkTitle}
                            onChange={(e) => setWalkTitle(e.target.value)}
                            placeholder="산책 제목"
                        />

                        <textarea
                            value={walkMemo}
                            onChange={(e) => setWalkMemo(e.target.value)}
                            placeholder="산책 메모"
                        />

                        <h3>함께 산책한 반려동물</h3>
                        <div className="pet-selector-wrapper">

                        <div
                            className="pet-selector-box"
                            onClick={() => setPetSelectorOpen(prev => !prev)}
                        >
                            <span>
                            {
                                selectedPetIds.length === 0
                                    ? "반려동물 선택"
                                    : walkablePets
                                        .filter(pet => selectedPetIds.includes(pet.petId))
                                        .map(pet => pet.name)
                                        .join(", ")
                            }
                        </span>

                        <span className="pet-selector-arrow">
                            ⌄
                        </span>
                        </div>


                        {petSelectorOpen && (
                            <div className="pet-selector-list">

                                {walkablePets.map((pet)=>(
                                    <label 
                                        key={pet.petId}
                                        className="pet-selector-item"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedPetIds.includes(pet.petId)}
                                            onChange={() => togglePet(pet.petId)}
                                        />

                                        {pet.name}

                                    </label>
                                ))}

                            </div>
                        )}

                    </div>

                        <button
                            className="walk-primary-button"
                            onClick={() => {
                                saveCompletedWalk();
                            }}
                        >
                            저장하기
                        </button>
                    </div>
                </div>
            )}

            <BottomNavigation />
        </main>
    );
}
