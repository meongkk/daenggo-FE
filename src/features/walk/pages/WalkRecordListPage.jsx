import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Walk.css';
import { getWalkCalendar } from '../api/walkApi';

export default function WalkRecordListPage() {

    const navigate = useNavigate();
    const { date } = useParams();

    const [walks, setWalks] = useState([]);

    useEffect(() => {

        async function loadWalks(){

            const [year, month] = date.split('-');

            const data = await getWalkCalendar(
                Number(year),
                Number(month)
            );

            const filtered = data.walks.filter(
                item => item.walkDate === date
            );

            setWalks(filtered);
        }

        loadWalks();

    }, [date]);


    return (
        <main className="walk-mobile-container">

            <header className="walk-header">

                <button
                    className="walk-header-back"
                    onClick={()=>navigate(-1)}
                >
                    ‹
                </button>

                {date} 산책 기록

            </header>


            <section className="walk-record-page">

                <h2>
                    {walks.length}개의 산책
                </h2>


                {walks.map((walk)=>(

                <div
                    key={walk.walkRecordId}
                    className="walk-record-card"
                    onClick={() =>
                        navigate(`/walk/${walk.walkRecordId}`)
                    }
                >

                    <h3>
                        {walk.title || '산책 기록'}
                    </h3>

                    <p>
                        {walk.memo || '메모 없음'}
                    </p>

                </div>

                ))}


            </section>


            <div className="walk-primary-action-wrap">

                <button
                    className="walk-primary-button"
                    onClick={()=>navigate('/walk')}
                >
                    확인
                </button>

            </div>


        </main>
    );
}