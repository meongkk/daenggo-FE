import AppIcon from '../../../components/ui/AppIcon';

export default function EmptyImage() {
  return (
    <div className="empty-image" aria-label="이미지 준비 중">
      <AppIcon name="image" size={32} />
    </div>
  );
}
