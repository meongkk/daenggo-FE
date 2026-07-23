import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    deleteWalk,
    getWalkDetail,
    getWalkRoute,
    getWalkPhotos,
    updateWalk,
} from '../api/walkApi';
import BottomNavigation from '../../../components/BottomNavigation';
import './Walk.css';

const TEMP_USER_ID = Number(import.meta.env.VITE_BOARD_WRITER_ID ?? 1);

function formatDuration(totalSeconds = 0) {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function formatPace(totalSeconds = 0) {
    if (!totalSeconds) return `--′--″`;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(Math.round(totalSeconds % 60)).padStart(2, '0');
    return `${minutes}′${seconds}″`;
}

function formatStartTime(startedAt) {
    if (!startedAt) return '--:--';
    return new Date(startedAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

function makeRouteDrawing(points) {
    if (!points.length) return '';

    const latitudes = points.map((point) => Number(point.latitude));
    const longitudes = points.map((point) => Number(point.longitude));
    const minLatitude = Math.min(...latitudes);
    const maxLatitude = Math.max(...latitudes);
    const minLongitude = Math.min(...longitudes);
    const maxLongitude = Math.max(...longitudes);
    const latitudeRange = maxLatitude - minLatitude || 0.000001;
    const longitudeRange = maxLongitude - minLongitude || 0.000001;

    // 실제 위경도를 SVG의 0~100 좌표로 바꿔 작은 미리보기 안에 경로를 그립니다.
    return points.map((point) => {
        const x = 8 + ((Number(point.longitude) - minLongitude) / longitudeRange) * 84;
        const y = 92 - ((Number(point.latitude) - minLatitude) / latitudeRange) * 84;
        return `${x},${y}`;
    }).join(' ');
}

export default function WalkDetailPage() {
    const { walkId } = useParams();
    const navigate = useNavigate();
    const [detail, setDetail] = useState(null);
    const [routePoints, setRoutePoints] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [memo, setMemo] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const routeDrawing = useMemo(() => makeRouteDrawing(routePoints), [routePoints]);

    // 산책 불러오기
    useEffect(() => {
        let isCurrentRequest = true;

        async function loadWalk() {
            setIsLoading(true);
            setErrorMessage('');
            const [detailResult, routeResult, photoResult] = await Promise.allSettled([
                getWalkDetail(walkId, TEMP_USER_ID),
                getWalkRoute(walkId, TEMP_USER_ID),
                getWalkPhotos(TEMP_USER_ID, walkId),
            ]);

            if (!isCurrentRequest) return;

            if (detailResult.status === 'fulfilled') {
                // console.log("detail", detailResult.value);
                setDetail(detailResult.value);
                setTitle(detailResult.value?.title ?? '산책 기록');
                setMemo(detailResult.value?.memo ?? '');
            } else {
                setErrorMessage(
                    detailResult.reason?.response?.data?.message
                    ?? '산책 상세 정보를 불러오지 못했어요.',
                );
            }

            if (routeResult.status === 'fulfilled') {
                // console.log("route", routeResult.value);
                const routeData = routeResult.value;
                setRoutePoints(Array.isArray(routeData) ? routeData : routeData?.routePoints ?? []);
            }
            setIsLoading(false);

            if (photoResult.status === 'fulfilled') {
                console.log("사진 데이터:", photoResult.value);
                setPhotos(photoResult.value);
            }
        }

        loadWalk();
        return () => { isCurrentRequest = false; };
    }, [walkId]);


    // 지도 그리기
    useEffect(() => {

        console.log("window.kakao =", window.kakao);
        console.log("routePoints =", routePoints);
    
        if (!window.kakao) {
            console.log("카카오 없음");
            return;
        }
    
        if (routePoints.length === 0) {
            console.log("좌표 없음");
            return;
        }
    
        console.log("지도 생성 시작");
        
        window.kakao.maps.load(() => {
    
            const first = routePoints[0];
    
            const container =
                document.getElementById("walk-static-map");
    
            const options = {
                center: new window.kakao.maps.LatLng(
                    first.latitude,
                    first.longitude
                ),
                level: 5
            };
    
            const map = new window.kakao.maps.Map(
                container,
                options
            );
    
            const path = routePoints.map(point =>
                new window.kakao.maps.LatLng(
                    point.latitude,
                    point.longitude
                )
            );
    
            const polyline = new window.kakao.maps.Polyline({
                path,
                strokeWeight: 5,
                strokeColor: "#E86339",
                strokeOpacity: 0.9
            });
    
            polyline.setMap(map);
    
            const bounds =
                new window.kakao.maps.LatLngBounds();
    
            path.forEach(p => bounds.extend(p));
    
            map.setBounds(bounds);
    
            // 드래그 막기
            map.setDraggable(false);
    
            // 확대 막기
            map.setZoomable(false);
    
        });
    
    }, [routePoints]);

    async function handleSave() {
        if (!title.trim()) {
            setErrorMessage('산책 제목을 입력해 주세요.');
            return;
        }

        try {
            setIsSaving(true);
            setErrorMessage('');
            const updated = await updateWalk(walkId, {
                title: title.trim(),
                memo: memo.trim(),
            });
            setDetail((current) => ({
                ...current,
                ...(updated && typeof updated === 'object' ? updated : {}),
                title: title.trim(),
                memo: memo.trim(),
            }));
            setIsEditing(false);
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message
                ?? '수정 내용을 저장하지 못했어요.',
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        const shouldDelete = window.confirm('이 산책 기록을 삭제할까요? 삭제하면 되돌릴 수 없어요.');
        if (!shouldDelete) return;

        try {
            setErrorMessage('');
            await deleteWalk(walkId);
            navigate('/walk');
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message
                ?? '산책 기록을 삭제하지 못했어요.',
            );
        }
    }

    const distanceKm = (Number(detail?.distanceM ?? 0) / 1000).toFixed(2);
    const petIds = detail?.petIds ?? [];

    return (
        <main className="walk-mobile-container">
            <header className="walk-header walk-detail-header">
                <button type="button" className="walk-header-back" onClick={() => navigate('/walk')} aria-label="목록으로 돌아가기">‹</button>
                산책 상세
                <button type="button" className="walk-header-close" onClick={() => navigate('/walk')} aria-label="닫기">×</button>
            </header>

            <section className="walk-detail-content">
                {isLoading && <p className="walk-center-message">산책 정보를 불러오는 중이에요.</p>}

                {!isLoading && detail && (
                    <>
                        <div className="walk-detail-title-row">
                            {isEditing ? (
                                <input
                                    className="walk-detail-title-input"
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    maxLength={50}
                                    aria-label="산책 제목"
                                />
                            ) : (
                                <div>
                                    <span className="walk-detail-date">
                                        {detail.startedAt
                                            ? new Date(detail.startedAt).toLocaleDateString('ko-KR')
                                            : '날짜 정보 없음'}
                                    </span>
                                    <h1>{detail.title || '산책 기록'}</h1>
                                </div>
                            )}
                            <div className="walk-detail-menu">
                                {!isEditing && <button type="button" onClick={() => setIsEditing(true)}>수정</button>}
                                <button type="button" className="danger" onClick={handleDelete}>삭제</button>
                            </div>
                        </div>

                        <div className="walk-distance-row">
                            <strong>{distanceKm}<small>KM</small></strong>
                            <div className="walk-pet-list" aria-label="참여 반려동물">
                                {petIds.length > 0
                                    ? petIds.map((petId) => <span key={petId} title={`반려동물 ID ${petId}`}>🐕</span>)
                                    : <span title="선택된 반려동물 없음">🐾</span>}
                            </div>
                        </div>

                        <div
                            className="walk-route-card"
                        >
                            <div
                                id="walk-static-map"
                                className="walk-static-map"
                                onClick={() => navigate(`/walk/${walkId}/map`)}
                            />

                            <div className="walk-detail-stats">
                                <div>
                                    <strong>{formatStartTime(detail.startedAt)}</strong>
                                    <span>시작 시간</span>
                                </div>

                                <div>
                                    <strong>{formatPace(detail.avgPaceSec)}</strong>
                                    <span>페이스</span>
                                </div>

                                <div>
                                    <strong>{formatDuration(detail.durationSec)}</strong>
                                    <span>총 산책 시간</span>
                                </div>
                            </div>
                        </div>

                        {photos.length > 0 && (
                            <div className="walk-photo-section">
                                <h2>산책 사진</h2>

                                <div className="walk-photo-list">
                                    {photos.map((photo) => (
                                        <img
                                            key={photo.walkPhotoId}
                                            src={`http://localhost:8080${photo.imageUrl}`}
                                            alt="산책 사진"
                                            className="walk-photo"
                                            onClick={() => setSelectedPhoto(photo)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="walk-memo-section">
                            <h2>메모 내용</h2>
                            {isEditing ? (
                                <textarea
                                    value={memo}
                                    onChange={(event) => setMemo(event.target.value)}
                                    maxLength={500}
                                    placeholder="산책 중 있었던 일을 적어 주세요."
                                />
                            ) : (
                                <p>{detail.memo || '작성한 메모가 없어요.'}</p>
                            )}
                        </div>

                        {isEditing && (
                            <div className="walk-edit-actions">
                                <button type="button" className="walk-secondary-button" onClick={() => setIsEditing(false)}>취소</button>
                                <button type="button" className="walk-primary-button" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? '저장 중...' : '수정 저장'}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {!isLoading && !detail && (
                    <div className="walk-empty-detail">
                        <span>🐾</span>
                        <p>백엔드가 준비되면 이곳에 산책 상세 내용이 표시돼요.</p>
                        <button type="button" onClick={() => navigate('/walk')}>달력으로 돌아가기</button>
                    </div>
                )}

                {errorMessage && <p className="walk-error-message" role="alert">{errorMessage}</p>}
                {selectedPhoto && (
                    <div
                        className="walk-photo-modal"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <img
                            src={`http://localhost:8080${selectedPhoto.imageUrl}`}
                            alt="확대된 산책 사진"
                            className="walk-photo-large"
                            onClick={(e) => e.stopPropagation()}
                        />

                        <button
                            className="walk-photo-close"
                            onClick={() => setSelectedPhoto(null)}
                        >
                            ×
                        </button>
                    </div>
                )}
            </section>

            <BottomNavigation />
        </main>
    );
}
