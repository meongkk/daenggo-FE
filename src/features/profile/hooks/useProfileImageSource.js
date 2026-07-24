import { useEffect, useState } from 'react';
import { loadPrivateProfileImage } from '../api/profileImageApi';

const PRIVATE_PROFILE_IMAGE_PATTERN = /^\/api\/(?:users|pets)\/images\//;

export default function useProfileImageSource(imageUrl) {
  const [imageSource, setImageSource] = useState('');

  useEffect(() => {
    if (!imageUrl) {
      setImageSource('');
      return undefined;
    }

    if (!PRIVATE_PROFILE_IMAGE_PATTERN.test(imageUrl)) {
      setImageSource(imageUrl);
      return undefined;
    }

    const controller = new AbortController();
    let objectUrl = '';

    setImageSource('');

    loadPrivateProfileImage(imageUrl, { signal: controller.signal })
      .then((loadedObjectUrl) => {
        objectUrl = loadedObjectUrl;
        setImageSource(loadedObjectUrl);
      })
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') {
          setImageSource('');
        }
      });

    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageUrl]);

  return imageSource;
}
