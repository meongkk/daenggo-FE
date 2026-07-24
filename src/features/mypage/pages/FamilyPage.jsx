import AppIcon from '../../../components/ui/AppIcon';
import BottomNavigation from '../../../components/navigation/BottomNavigation';
import MyPageHeader from '../components/MyPageHeader';
import './MyPage.css';

const family = ['엄마', '아빠', '형제1', '형제2'];

export default function FamilyPage() {
  const actions = (
    <div className="family-actions">
      <button type="button"><AppIcon name="plus" size={17} /> 초대하기</button>
      <button type="button"><AppIcon name="plus" size={17} /> 등록하기</button>
    </div>
  );

  return (
    <div className="mobile-screen mypage-screen mypage-subpage">
      <MyPageHeader title="가족 관리" action={actions} />
      <main className="family-list">
        {family.map((member) => <button key={member} type="button">{member}</button>)}
      </main>
      <BottomNavigation active="mypage" />
    </div>
  );
}
