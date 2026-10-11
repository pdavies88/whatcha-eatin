import { createContext, use, useState, type ReactNode } from 'react';

import { loadProfile, saveProfile } from '@/lib/storage/profile';
import type { Profile } from '@/lib/targets';

type ProfileContextValue = {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  // Read synchronously so the Week tab shows targets on its first render.
  const [profile, setProfileState] = useState(loadProfile);

  const setProfile = (next: Profile | null) => {
    setProfileState(next);
    void saveProfile(next);
  };

  return <ProfileContext value={{ profile, setProfile }}>{children}</ProfileContext>;
}

export function useProfile(): ProfileContextValue {
  const context = use(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
