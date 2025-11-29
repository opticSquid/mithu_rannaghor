import { Tabs } from 'expo-router';
import React from 'react';
import { View, Pressable } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { THEME, NAV_THEME } from '@/lib/theme';

export default function TabsLayout() {
    const { colorScheme } = useColorScheme();
    const themeMode = colorScheme ?? 'light';
    const theme = NAV_THEME[themeMode];
    const colors = THEME[themeMode];

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: colors.text,
                tabBarShowLabel: false,
                lazy: true,
            }}
            tabBar={(props) => <CustomTabBar {...props} colors={colors} />}
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

function CustomTabBar({ state, descriptors, navigation, colors }: any) {
    const tabWidth = 100 / state.routes.length;

    return (
        <View
            className="border-t border-border"
            style={{ backgroundColor: colors.card }}
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
                                className={`text-center text-sm ${isFocused
                                        ? 'font-semibold'
                                        : 'font-normal'
                                    }`}
                                style={{
                                    color: isFocused
                                        ? colors.primary
                                        : colors.mutedForeground,
                                }}
                            >
                                {label}
                            </Text>
                            {isFocused && (
                                <View
                                    className="absolute bottom-0 h-1 rounded-full"
                                    style={{
                                        width: `${tabWidth}%`,
                                        backgroundColor: colors.primary,
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
