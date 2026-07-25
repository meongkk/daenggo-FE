import BottomNavigation from '../../../components/BottomNavigation';
import EmptyImage from '../components/EmptyImage';
import MyPageHeader from '../components/MyPageHeader';
import './MyPage.css';

const categories = ['음식점', '카페', '공원', '숙소'];
const favorites = [1, 2, 3, 4];

export default function FavoritesPage() {
  return (
    <div className="mobile-screen mypage-screen mypage-subpage">
      <MyPageHeader title="찜 목록 관리" />
      <div className="favorite-categories">
        {categories.map((category, index) => <button key={category} type="button" className={index === 0 ? 'is-active' : ''}>{category}</button>)}
      </div>
      <main className="favorite-list">
        {favorites.map((item) => (
          <article className="favorite-card" key={item}>
            <EmptyImage />
            <div><strong>식당 이름</strong><span>반려견 입장 가능</span></div>
          </article>
        ))}
      </main>
      <BottomNavigation />
    </div>
  );
}
