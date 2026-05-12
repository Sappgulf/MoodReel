import { useState, useEffect } from 'react';

import { StorageKeys as SK } from '../storage/storageKeys';
import { safeGetJSON, safeSetJSON } from '../storage/safeStorage';

export const useUserProfile = () => {
  const [profile, setProfile] = useState(() => {
    return safeGetJSON(SK.PROFILE, {
      username: 'Cinephile',
      avatar: '🎬',
      bio: 'Movie lover and vibe seeker.',
      joinDate: new Date().toISOString(),
      isPublic: true,
      theme: 'default',
    });
  });

  useEffect(() => {
    safeSetJSON(SK.PROFILE, profile);
  }, [profile]);

  const updateProfile = updates => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return { profile, updateProfile };
};
