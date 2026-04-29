import { useState, useEffect } from 'react';

import { StorageKeys as SK } from '../storage/storageKeys';

export const useUserProfile = () => {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(SK.PROFILE);
    return saved
      ? JSON.parse(saved)
      : {
          username: 'Cinephile',
          avatar: '🎬',
          bio: 'Movie lover and vibe seeker.',
          joinDate: new Date().toISOString(),
          isPublic: true,
          theme: 'default',
        };
  });

  useEffect(() => {
    localStorage.setItem(SK.PROFILE, JSON.stringify(profile));
  }, [profile]);

  const updateProfile = updates => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return { profile, updateProfile };
};
