import { View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import TimePicker from '@/components/ui/time-picker';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { loadPreferences, savePreferences, type DayPreference } from '@/lib/preferencesService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ProfileScreen() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<DayPreference[]>(
    DAYS.map((day) => ({
      day,
      vegNonVeg: 'non-veg',
      lunchTime: '12:00 PM',
      dinnerTime: '7:00 PM',
    }))
  );
  const [editingDay, setEditingDay] = useState<string | null>(null);

  useEffect(() => {
    loadPreferencesData();
  }, []);

  const loadPreferencesData = async () => {
    try {
      const prefs = await loadPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreference = async (updatedPrefs: DayPreference[]) => {
    try {
      await savePreferences(updatedPrefs);
      setPreferences(updatedPrefs);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const updateDayPreference = (
    day: string,
    field: 'vegNonVeg' | 'lunchTime' | 'dinnerTime',
    value: string
  ) => {
    const updated = preferences.map((pref) =>
      pref.day === day ? { ...pref, [field]: value } : pref
    );
    savePreference(updated);
    setEditingDay(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'top']}>
      <ScrollView className="flex-1 bg-background">
        <View className="p-6">
          {/* Profile Header */}
          <View className="mb-8 items-center">
            <View className="mb-4 h-24 w-24 items-center justify-center rounded-full border-2 border-primary bg-secondary">
              <Text className="text-4xl">👤</Text>
            </View>
            <Text className="text-2xl font-bold">John Doe</Text>
            <Text className="text-muted-foreground">+91 9876543210</Text>
          </View>

          {/* Weekly Preferences Section */}
          <View className="mb-8">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold">Weekly Preferences</Text>
            </View>

            <View className="rounded-lg border border-border bg-card p-3">
              {/* Header Row */}
              <View className="mb-3 flex-row">
                <Text className="w-1/5 text-xs font-semibold text-muted-foreground">Day</Text>
                <Text className="w-1/5 text-xs font-semibold text-muted-foreground">Type</Text>
                <Text className="w-1/4 text-xs font-semibold text-muted-foreground">Lunch</Text>
                <Text className="w-1/4 text-xs font-semibold text-muted-foreground">Dinner</Text>
                <Text className="w-1/6 text-xs font-semibold text-muted-foreground">Edit</Text>
              </View>

              {preferences.map((pref) => (
                <View key={pref.day} className="mb-3 flex-row items-center gap-1">
                  <Text className="w-1/5 text-xs font-medium">{pref.day.slice(0, 3)}</Text>
                  <Text className="w-1/5 text-xs">
                    {pref.vegNonVeg === 'veg' ? '🥬' : '🍗'}
                  </Text>
                  <Text className="w-1/4 text-xs">{pref.lunchTime}</Text>
                  <Text className="w-1/4 text-xs">{pref.dinnerTime}</Text>
                  <Pressable
                    onPress={() => setEditingDay(editingDay === pref.day ? null : pref.day)}
                    className="w-1/6 rounded bg-primary px-2 py-1"
                  >
                    <Text className="text-xs font-medium text-primary-foreground">Edit</Text>
                  </Pressable>
                </View>
              ))}

              {/* Edit Form */}
              {editingDay && (
                <View className="mt-4 border-t border-border pt-4">
                  <Text className="mb-3 font-semibold">{editingDay}</Text>

                  <View className="mb-3">
                    <Text className="mb-2 text-xs font-medium">Food Type</Text>
                    <View className="flex-row gap-2">
                      {['veg', 'non-veg'].map((type) => (
                        <Pressable
                          key={type}
                          onPress={() =>
                            updateDayPreference(
                              editingDay,
                              'vegNonVeg',
                              type as 'veg' | 'non-veg'
                            )
                          }
                          className={`flex-1 rounded px-3 py-2 ${preferences.find((p) => p.day === editingDay)?.vegNonVeg ===
                              type
                              ? 'bg-primary'
                              : 'border border-border bg-background'
                            }`}
                        >
                          <Text
                            className={`text-center text-xs font-medium ${preferences.find((p) => p.day === editingDay)?.vegNonVeg ===
                                type
                                ? 'text-primary-foreground'
                                : 'text-foreground'
                              }`}
                          >
                            {type === 'veg' ? '🥬 Veg' : '🍗 Non-Veg'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View className="mb-3">
                    <TimePicker
                      label="Lunch Time"
                      value={preferences.find((p) => p.day === editingDay)?.lunchTime || '12:00 PM'}
                      onChange={(time) => updateDayPreference(editingDay, 'lunchTime', time)}
                    />
                  </View>

                  <View className="mb-3">
                    <TimePicker
                      label="Dinner Time"
                      value={preferences.find((p) => p.day === editingDay)?.dinnerTime || '7:00 PM'}
                      onChange={(time) => updateDayPreference(editingDay, 'dinnerTime', time)}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Settings Button */}
          <Pressable
            onPress={() => router.push('/(tabs)/profile/settings')}
            className="rounded-lg bg-primary px-6 py-3"
          >
            <Text className="text-center font-semibold text-primary-foreground">
              ⚙️ Settings
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
