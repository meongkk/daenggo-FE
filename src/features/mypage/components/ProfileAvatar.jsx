import AppIcon from '../../../components/ui/AppIcon';

export default function ProfileAvatar({
  editable = false,
  imageUrl = null,
  nickname = '',
  size = 'large',
}) {
  return (
    <div className={`profile-avatar profile-avatar--${size}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={`${nickname || '사용자'} 프로필`} />
      ) : (
        <AppIcon name="user" size={size === 'large' ? 56 : 38} strokeWidth={1.5} />
      )}
      {editable && (
        <span className="profile-avatar__edit" aria-hidden="true">
          <AppIcon name="edit" size={13} strokeWidth={2.2} />
        </span>
      )}
    </div>
  );
}
