import Storage from 'expo-sqlite/kv-store';
import { z } from 'zod';

import type { Profile } from '@/lib/targets';

// The profile is health information, so it stays on this device. It is never sent to an AI provider.
const PROFILE_KEY = 'profile.v1';

export const ProfileSchema = z.object({
  age: z.number().int().min(1).max(120),
  sex: z.enum(['female', 'male', 'unspecified']),
  heightCm: z.number().min(50).max(272),
  weightKg: z.number().min(20).max(400),
  activity: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  goal: z.enum(['lose', 'maintain', 'gain']),
  units: z.enum(['us', 'metric']),
}) satisfies z.ZodType<Profile>;

export function loadProfile(): Profile | null {
  const raw = Storage.getItemSync(PROFILE_KEY);
  if (!raw) return null;
  const parsed = ProfileSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

export function saveProfile(profile: Profile | null): Promise<unknown> {
  return profile ? Storage.setItemAsync(PROFILE_KEY, JSON.stringify(profile)) : Storage.removeItemAsync(PROFILE_KEY);
}
