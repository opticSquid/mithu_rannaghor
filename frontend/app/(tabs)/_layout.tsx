import { Tabs } from 'expo-router';
import React from 'react';
import { View, Pressable } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { NAV_THEME } from '@/lib/theme';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const theme = NAV_THEME[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.background,
        tabBarShowLabel: false,
        lazy: true,
      }}
      tabBar={(props) => <CustomTabBar {...props} theme={theme} />}
      initialRouteName="wallet"
    >
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

function CustomTabBar({ state, descriptors, navigation, theme }: any) {
  const tabWidth = 100 / state.routes.length;

  return (
    <View
      className="border-t border-border bg-background"
      style={{ backgroundColor: theme.colors.background }}
    >
      <View className="flex-row">
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              className="flex-1 items-center justify-center py-4"
            >
              <Text
                className={`text-center text-sm ${
                  isFocused
                    ? 'font-semibold'
                    : 'font-normal'
                }`}
                style={{
                  color: isFocused
                    ? theme.colors.primary
                    : theme.colors.muted,
                }}
              >
                {label}
              </Text>
              {isFocused && (
                <View
                  className="absolute bottom-0 h-1 rounded-full"
                  style={{
                    width: `${tabWidth}%`,
                    backgroundColor: theme.colors.primary,
                  }}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
