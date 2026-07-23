import { useEffect, useRef } from "react";

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;

export function KakaoMap({ currentPosition, routePoints  }) {

    const mapRef = useRef(null);
    const polylineRef = useRef(null);
    const circleRef = useRef(null);
    // 1. 지도 생성
    useEffect(() => {

        const script = document.createElement("script");
    
        script.src =
            `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    
        script.async = true;
    
        script.onload = () => {
    
            window.kakao.maps.load(() => {
    
                const container = document.getElementById('map');
    
    
                const center = currentPosition
                    ? new window.kakao.maps.LatLng(
                        currentPosition.latitude,
                        currentPosition.longitude
                    )
                    : new window.kakao.maps.LatLng(
                        37.5665,
                        126.9780
                    );
    
    
                const map = new window.kakao.maps.Map(
                    container,
                    {
                        center,
                        level: 3
                    }
                );

                const polyline = new window.kakao.maps.Polyline({
                    map: map,
                    path: [],
                    strokeWeight: 6,
                    strokeColor: '#E86339',
                    strokeOpacity: 0.8,
                    strokeStyle: 'solid'
                });
                
                polylineRef.current = polyline;
    
    
                mapRef.current = map;
    
                const content = `
                    <div style="
                        width:16px;
                        height:16px;
                        background:#E86339;
                        border:3px solid white;
                        border-radius:50%;
                        box-shadow:0 0 0 6px rgba(232,99,57,0.25);
                    "></div>
                    `;
                    
                const circle = new kakao.maps.CustomOverlay({
                    position: center,
                    content: content,
                    yAnchor: 0.5,
                    xAnchor: 0.5,
                });
                
                
                circle.setMap(map);
                
                circleRef.current = circle;

    
                window.addEventListener(
                    "resize",
                    () => map.relayout()
                );
    
            });
        };
    
    
        document.head.appendChild(script);
    
    
    }, []);

  // 3. 위치 변경 시 마커 이동
  useEffect(() => {

    if (!currentPosition) return;
    if (!circleRef.current) return;


    const latlng =
        new window.kakao.maps.LatLng(
            currentPosition.latitude,
            currentPosition.longitude
        );


    circleRef.current.setPosition(latlng);

    // if (circleRef.current) {
    //     circleRef.current.setPosition(latlng);
    // }

    if (mapRef.current) {
        mapRef.current.panTo(latlng);
    }


}, [currentPosition]);

useEffect(() => {

    if (!polylineRef.current) return;
    if (!routePoints || routePoints.length === 0) return;


    const path = routePoints.map(
        point =>
            new window.kakao.maps.LatLng(
                point.latitude,
                point.longitude
            )
    );


    polylineRef.current.setPath(path);


}, [routePoints]);


  return (
    <div 
      id="map"
      className="walk-map-canvas"
    ></div>
  );
}

export default KakaoMap;