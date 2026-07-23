import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    completeWalk,
    saveWalkTrackPoints,
    uploadWalkPhoto,
} from '../api/walkApi';
import BottomNavigation from '../../../components/BottomNavigation';
import './Walk.css';
import KakaoMap from "../../../components/KakaoMap";
const TEMP_USER_ID = Number(import.meta.env.VITE_BOARD_WRITER_ID ?? 1);

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
    const [routePoints, setRoutePoints] = useState([]);
    const [savedPhotoUrl, setSavedPhotoUrl] = useState('');
    const [message, setMessage] = useState('현재 위치를 기록하고 있어요.');
    const [errorMessage, setErrorMessage] = useState('');
    

    const timerIdRef = useRef(null);
    const gpsWatchIdRef = useRef(null);
    const lastPositionRef = useRef(null);
    const sequenceRef = useRef(0);
    const gpsBufferRef = useRef([]);
    const pendingGpsRequestRef = useRef(Promise.resolve());
    const photoPreviewRef = useRef('');

    function stopDeviceTracking() {
        if (timerIdRef.current) window.clearInterval(timerIdRef.current);
        if (gpsWatchIdRef.current !== null && navigator.geolocation) {
            navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        }
        timerIdRef.current = null;
        gpsWatchIdRef.current = null;
    }

    useEffect(() => {
        if (!walkId) return;
    
        setMessage('산책을 기록하고 있어요.');
    
        beginDeviceTracking(Number(walkId));
    
        return () => {
            stopDeviceTracking();

            if (photoPreviewRef.current) {
                URL.revokeObjectURL(photoPreviewRef.current);
            }
        };

    }, [walkId]);

    function queueGpsBatch(activeWalkId, points) {
        pendingGpsRequestRef.current = pendingGpsRequestRef.current
            .then(() => saveWalkTrackPoints(activeWalkId, TEMP_USER_ID, points))
            .catch((error) => {
                setErrorMessage(
                    error.response?.data?.message
                    ?? 'GPS 좌표를 서버에 저장하지 못했어요. 백엔드 API를 확인해 주세요.',
                );
            });
    }

    function beginDeviceTracking(activeWalkId) {
        const startedAt = Date.now();
        timerIdRef.current = window.setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
        }, 1000);

        if (!navigator.geolocation) {
            setErrorMessage('이 브라우저는 GPS 위치 기능을 지원하지 않아요.');
            return;
        }

        gpsWatchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
               

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

    async function handleCompleteWalk() {
        if (!walkId) return;
        stopDeviceTracking();
        setPhase('completing');
        setErrorMessage('');

        try {
            if (gpsBufferRef.current.length > 0) {
                const lastBatch = gpsBufferRef.current.splice(0);
                queueGpsBatch(walkId, lastBatch);
            }
            await pendingGpsRequestRef.current;

            const data = await completeWalk(walkId, TEMP_USER_ID, {
                title: `${new Date().toLocaleDateString('ko-KR')} 산책`,
                memo: '',
                petIds: [],
                distanceM: Number(distanceM.toFixed(2)),
            });
            const completedWalkId = data?.walkRecordId ?? walkId;
            navigate(`/walk/${completedWalkId}`);
        } catch (error) {
            console.log("산책 종료 에러:", error);
            console.log("응답:", error.response?.data);

            setPhase('active');
            setErrorMessage(
                error.response?.data?.message
                ?? '산책 종료 정보를 저장하지 못했어요. 다시 눌러 주세요.',
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
                <KakaoMap currentPosition={currentPosition} routePoints={routePoints} />
                {/* <div className="walk-current-marker" aria-label="현재 위치">
                    <span>🐾</span>
                    {currentPosition && <i />}
                </div> */}

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

            <BottomNavigation />
        </main>
    );
}
