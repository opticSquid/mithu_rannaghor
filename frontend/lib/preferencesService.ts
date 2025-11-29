import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DayPreference {
  day: string;
  vegNonVeg: 'veg' | 'non-veg';
  lunchTime: string;
  dinnerTime: string;
}

const STORAGE_KEY = 'meal-preferences';

const DEFAULT_PREFERENCES: DayPreference[] = [
  { day: 'Monday', vegNonVeg: 'non-veg', lunchTime: '12:00 PM', dinnerTime: '7:00 PM' },
  { day: 'Tuesday', vegNonVeg: 'non-veg', lunchTime: '12:00 PM', dinnerTime: '7:00 PM' },
  { day: 'Wednesday', vegNonVeg: 'non-veg', lunchTime: '12:00 PM', dinnerTime: '7:00 PM' },
  { day: 'Thursday', vegNonVeg: 'non-veg', lunchTime: '12:00 PM', dinnerTime: '7:00 PM' },
  { day: 'Friday', vegNonVeg: 'non-veg', lunchTime: '12:00 PM', dinnerTime: '7:00 PM' },
  { day: 'Saturday', vegNonVeg: 'non-veg', lunchTime: '12:00 PM', dinnerTime: '7:00 PM' },
  { day: 'Sunday', vegNonVeg: 'non-veg', lunchTime: '12:00 PM', dinnerTime: '7:00 PM' },
];

export const loadPreferences = async (): Promise<DayPreference[]> => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    // Initialize with defaults if not exists
    await savePreferences(DEFAULT_PREFERENCES);
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

export const savePreferences = async (preferences: DayPreference[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
};

export const getPreferenceForDay = async (day: string): Promise<DayPreference | undefined> => {
  const preferences = await loadPreferences();
  return preferences.find((p) => p.day === day);
};

export const updatePreferenceForDay = async (
  day: string,
  field: 'vegNonVeg' | 'lunchTime' | 'dinnerTime',
  value: string
): Promise<DayPreference[]> => {
  const preferences = await loadPreferences();
  const updated = preferences.map((pref) =>
    pref.day === day ? { ...pref, [field]: value } : pref
  );
  await savePreferences(updated);
  return updated;
};
