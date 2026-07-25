import AppIcon from '../../../components/ui/AppIcon';
import useProfileImageSource from '../../profile/hooks/useProfileImageSource';

export default function ProfileAvatar({
  editable = false,
  imageUrl = null,
  nickname = '',
  size = 'large',
}) {
  const imageSource = useProfileImageSource(imageUrl);

  return (
    <div className={`profile-avatar profile-avatar--${size}`}>
      {imageSource ? (
        <img src={imageSource} alt={`${nickname || '사용자'} 프로필`} />
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
