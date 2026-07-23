import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWalkRoute } from '../api/walkApi';
import BottomNavigation from '../../../components/BottomNavigation';
import './Walk.css';

const TEMP_USER_ID = Number(import.meta.env.VITE_BOARD_WRITER_ID ?? 1);

export default function WalkRouteMapPage() {
    const { walkId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        async function loadRoute() {
            try {
                const response = await getWalkRoute(walkId, TEMP_USER_ID);

                const routePoints = Array.isArray(response)
                    ? response
                    : response.routePoints ?? [];

                if (routePoints.length === 0) return;

                window.kakao.maps.load(() => {

                    const first = routePoints[0];

                    const container = document.getElementById('walk-map');

                    const map = new window.kakao.maps.Map(container, {
                        center: new window.kakao.maps.LatLng(
                            Number(first.latitude),
                            Number(first.longitude)
                        ),
                        level: 4,
                    });

                    const path = routePoints.map(point =>
                        new window.kakao.maps.LatLng(
                            Number(point.latitude),
                            Number(point.longitude)
                        )
                    );

                    const polyline = new window.kakao.maps.Polyline({
                        path,
                        strokeWeight: 6,
                        strokeColor: '#E86339',
                        strokeOpacity: 0.9,
                        strokeStyle: 'solid',
                    });

                    polyline.setMap(map);

                    // 시작 마커
                    new window.kakao.maps.Marker({
                        position: path[0],
                        map,
                    });

                    // 종료 마커
                    new window.kakao.maps.Marker({
                        position: path[path.length - 1],
                        map,
                    });

                    // 경로가 모두 보이도록
                    const bounds = new window.kakao.maps.LatLngBounds();

                    path.forEach(position => bounds.extend(position));

                    map.setBounds(bounds);

                });

            } catch (e) {
                console.error(e);
            }
        }

        loadRoute();

    }, [walkId]);

    return (
        <main className="walk-mobile-container">

            <header className="walk-header">
                <button
                    type="button"
                    className="walk-header-back"
                    onClick={() => navigate(-1)}
                >
                    ‹
                </button>

                산책 경로

                <button
                    type="button"
                    className="walk-header-close"
                    onClick={() => navigate(-1)}
                >
                    ×
                </button>
            </header>

            <div
                id="walk-map"
                style={{
                    width: '100%',
                    height: 'calc(100vh - 130px)',
                }}
            />

            <BottomNavigation />

        </main>
    );
}