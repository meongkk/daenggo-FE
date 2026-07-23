import { useEffect, useRef } from "react";
import pawImage from '../assets/icons/paw.png';

const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_KEY;

export function KakaoMap({ currentPosition, routePoints  }) {

    const markerRef = useRef(null);
    const mapRef = useRef(null);
    const polylineRef = useRef(null);

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
    
    
                const markerImage =
                    new window.kakao.maps.MarkerImage(
                        pawImage,
                        new window.kakao.maps.Size(40,40),
                        {
                            offset: new window.kakao.maps.Point(20,20)
                        }
                    );
    
    
                const marker =
                    new window.kakao.maps.Marker({
                        map,
                        image: markerImage,
                        position: center
                    });
    
    
                markerRef.current = marker;
    
    
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
    if (!markerRef.current) return;


    const latlng =
        new window.kakao.maps.LatLng(
            currentPosition.latitude,
            currentPosition.longitude
        );


    markerRef.current.setPosition(latlng);


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