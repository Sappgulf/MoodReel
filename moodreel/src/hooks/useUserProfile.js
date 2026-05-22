import { useState, useEffect } from 'react';

export const useUserProfile = () => {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('moodreel_profile');
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
    localStorage.setItem('moodreel_profile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = updates => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return { profile, updateProfile };
};
