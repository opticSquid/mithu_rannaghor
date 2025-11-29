import { View, Pressable, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app-theme');
      if (savedTheme) {
        setTheme(savedTheme as 'light' | 'dark' | 'auto');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    try {
      await AsyncStorage.setItem('app-theme', newTheme);
      setTheme(newTheme);

      if (newTheme === 'auto') {
        setColorScheme('system');
      } else {
        setColorScheme(newTheme);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Automatic';
      default:
        return 'Automatic';
    }
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6">
        {/* Header with Back Button */}
        <View className="mb-6 flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Text className="text-2xl">←</Text>
          </Pressable>
          <Text className="text-2xl font-bold">Settings</Text>
        </View>

        {/* Theme Settings */}
        <View className="rounded-lg border border-border bg-card p-4">
          <View className="mb-4">
            <Text className="text-base font-semibold">Theme</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Current: {getThemeLabel()}
            </Text>
          </View>

          <View className="gap-3">
            {(['light', 'dark', 'auto'] as const).map((themeOption) => (
              <Pressable
                key={themeOption}
                onPress={() => handleThemeChange(themeOption)}
                className={`rounded-md border p-4 ${
                  theme === themeOption
                    ? 'border-primary bg-primary'
                    : 'border-border bg-background'
                }`}
              >
                <Text
                  className={`text-base font-medium ${
                    theme === themeOption
                      ? 'text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {themeOption === 'light'
                    ? '☀️ Light Mode'
                    : themeOption === 'dark'
                      ? '🌙 Dark Mode'
                      : '🔄 Automatic (System Default)'}
                </Text>
                {theme === themeOption && (
                  <Text className="mt-1 text-xs text-primary-foreground">✓ Active</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
