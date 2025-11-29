import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { loadPreferences, type DayPreference } from '@/lib/preferencesService';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'veg' | 'non-veg';
  mealType: 'lunch' | 'dinner';
  day: string;
}

// Sample menu data for all days and meal types
const FULL_MENU: MenuItem[] = [
  // Monday
  { id: '1', name: 'Paneer Butter Masala', description: 'Creamy paneer in tomato gravy', price: 150, type: 'veg', mealType: 'lunch', day: 'Monday' },
  { id: '2', name: 'Basmati Rice', description: 'Fragrant basmati rice', price: 80, type: 'veg', mealType: 'lunch', day: 'Monday' },
  { id: '3', name: 'Butter Chicken', description: 'Tender chicken in butter sauce', price: 200, type: 'non-veg', mealType: 'lunch', day: 'Monday' },
  { id: '4', name: 'Tandoori Chicken', description: 'Grilled tandoori chicken', price: 220, type: 'non-veg', mealType: 'lunch', day: 'Monday' },
  { id: '5', name: 'Biryani', description: 'Fragrant rice with meat', price: 250, type: 'non-veg', mealType: 'dinner', day: 'Monday' },
  { id: '6', name: 'Vegetable Biryani', description: 'Fragrant rice with vegetables', price: 180, type: 'veg', mealType: 'dinner', day: 'Monday' },
  { id: '7', name: 'Dal Makhani', description: 'Creamy black dal', price: 120, type: 'veg', mealType: 'dinner', day: 'Monday' },
  { id: '8', name: 'Fish Curry', description: 'Spiced fish in coconut curry', price: 280, type: 'non-veg', mealType: 'dinner', day: 'Monday' },

  // Tuesday
  { id: '9', name: 'Chole Bhature', description: 'Fried bread with chickpeas', price: 120, type: 'veg', mealType: 'lunch', day: 'Tuesday' },
  { id: '10', name: 'Aloo Paratha', description: 'Potato stuffed flatbread', price: 100, type: 'veg', mealType: 'lunch', day: 'Tuesday' },
  { id: '11', name: 'Chicken Tikka', description: 'Marinated and grilled chicken', price: 210, type: 'non-veg', mealType: 'lunch', day: 'Tuesday' },
  { id: '12', name: 'Mutton Curry', description: 'Slow cooked mutton', price: 280, type: 'non-veg', mealType: 'lunch', day: 'Tuesday' },
  { id: '13', name: 'Rajma Rice', description: 'Kidney beans with rice', price: 130, type: 'veg', mealType: 'dinner', day: 'Tuesday' },
  { id: '14', name: 'Prawn Biryani', description: 'Biryani with fresh prawns', price: 320, type: 'non-veg', mealType: 'dinner', day: 'Tuesday' },
  { id: '15', name: 'Paneer Tikka Masala', description: 'Paneer tikka in cream sauce', price: 160, type: 'veg', mealType: 'dinner', day: 'Tuesday' },
  { id: '16', name: 'Chicken Biryani', description: 'Biryani with chicken', price: 260, type: 'non-veg', mealType: 'dinner', day: 'Tuesday' },

  // Wednesday
  { id: '17', name: 'Idli Sambar', description: 'Steamed rice cake with lentil soup', price: 90, type: 'veg', mealType: 'lunch', day: 'Wednesday' },
  { id: '18', name: 'Dosa', description: 'Crispy rice crepe', price: 110, type: 'veg', mealType: 'lunch', day: 'Wednesday' },
  { id: '19', name: 'Chicken Dosa', description: 'Dosa with chicken filling', price: 180, type: 'non-veg', mealType: 'lunch', day: 'Wednesday' },
  { id: '20', name: 'Keema Dosa', description: 'Dosa with minced meat', price: 200, type: 'non-veg', mealType: 'lunch', day: 'Wednesday' },
  { id: '21', name: 'Sambar Rice', description: 'Rice with vegetable lentil soup', price: 100, type: 'veg', mealType: 'dinner', day: 'Wednesday' },
  { id: '22', name: 'Rasam Rice', description: 'Rice with spicy tamarind soup', price: 100, type: 'veg', mealType: 'dinner', day: 'Wednesday' },
  { id: '23', name: 'Chicken Curry Rice', description: 'Rice with chicken curry', price: 220, type: 'non-veg', mealType: 'dinner', day: 'Wednesday' },
  { id: '24', name: 'Egg Curry Rice', description: 'Rice with egg curry', price: 150, type: 'non-veg', mealType: 'dinner', day: 'Wednesday' },

  // Thursday
  { id: '25', name: 'Chana Masala', description: 'Spiced chickpea curry', price: 110, type: 'veg', mealType: 'lunch', day: 'Thursday' },
  { id: '26', name: 'Bhindi Fry', description: 'Stir-fried okra', price: 100, type: 'veg', mealType: 'lunch', day: 'Thursday' },
  { id: '27', name: 'Chicken Korma', description: 'Mild chicken in creamy sauce', price: 240, type: 'non-veg', mealType: 'lunch', day: 'Thursday' },
  { id: '28', name: 'Lamb Rogan Josh', description: 'Tender lamb in aromatic sauce', price: 290, type: 'non-veg', mealType: 'lunch', day: 'Thursday' },
  { id: '29', name: 'Baingan Bharta', description: 'Roasted eggplant', price: 120, type: 'veg', mealType: 'dinner', day: 'Thursday' },
  { id: '30', name: 'Hakka Noodles', description: 'Chinese style noodles', price: 140, type: 'veg', mealType: 'dinner', day: 'Thursday' },
  { id: '31', name: 'Chicken Hakka Noodles', description: 'Chinese noodles with chicken', price: 210, type: 'non-veg', mealType: 'dinner', day: 'Thursday' },
  { id: '32', name: 'Shrimp Hakka Noodles', description: 'Chinese noodles with shrimp', price: 280, type: 'non-veg', mealType: 'dinner', day: 'Thursday' },

  // Friday
  { id: '33', name: 'Chikhalwali', description: 'Sago and peanut preparation', price: 130, type: 'veg', mealType: 'lunch', day: 'Friday' },
  { id: '34', name: 'Falafel Wrap', description: 'Fried chickpea fritters wrap', price: 140, type: 'veg', mealType: 'lunch', day: 'Friday' },
  { id: '35', name: 'Chicken Shawarma', description: 'Marinated chicken wrap', price: 220, type: 'non-veg', mealType: 'lunch', day: 'Friday' },
  { id: '36', name: 'Seekh Kabab', description: 'Minced meat kabab', price: 250, type: 'non-veg', mealType: 'lunch', day: 'Friday' },
  { id: '37', name: 'Vegetable Pulao', description: 'Rice with mixed vegetables', price: 140, type: 'veg', mealType: 'dinner', day: 'Friday' },
  { id: '38', name: 'Malai Kofta', description: 'Cottage cheese dumplings', price: 170, type: 'veg', mealType: 'dinner', day: 'Friday' },
  { id: '39', name: 'Chicken Pulao', description: 'Rice with chicken', price: 230, type: 'non-veg', mealType: 'dinner', day: 'Friday' },
  { id: '40', name: 'Mutton Pulao', description: 'Rice with mutton', price: 280, type: 'non-veg', mealType: 'dinner', day: 'Friday' },

  // Saturday
  { id: '41', name: 'Upma', description: 'Semolina porridge', price: 80, type: 'veg', mealType: 'lunch', day: 'Saturday' },
  { id: '42', name: 'Poha', description: 'Flattened rice breakfast', price: 90, type: 'veg', mealType: 'lunch', day: 'Saturday' },
  { id: '43', name: 'Chicken Lollipop', description: 'Fried chicken drumettes', price: 200, type: 'non-veg', mealType: 'lunch', day: 'Saturday' },
  { id: '44', name: 'Malabar Paratha with Meat', description: 'Layered bread with meat', price: 260, type: 'non-veg', mealType: 'lunch', day: 'Saturday' },
  { id: '45', name: 'Malabar Paratha', description: 'Layered flatbread', price: 140, type: 'veg', mealType: 'dinner', day: 'Saturday' },
  { id: '46', name: 'Vegetable Fried Rice', description: 'Stir-fried rice with vegetables', price: 150, type: 'veg', mealType: 'dinner', day: 'Saturday' },
  { id: '47', name: 'Chicken Fried Rice', description: 'Stir-fried rice with chicken', price: 220, type: 'non-veg', mealType: 'dinner', day: 'Saturday' },
  { id: '48', name: 'Egg Fried Rice', description: 'Stir-fried rice with egg', price: 160, type: 'non-veg', mealType: 'dinner', day: 'Saturday' },

  // Sunday
  { id: '49', name: 'Khichdi', description: 'Rice and lentil comfort food', price: 100, type: 'veg', mealType: 'lunch', day: 'Sunday' },
  { id: '50', name: 'Puri Bhaji', description: 'Fried bread with potato curry', price: 110, type: 'veg', mealType: 'lunch', day: 'Sunday' },
  { id: '51', name: 'Chicken Biryani', description: 'Fragrant rice with chicken', price: 260, type: 'non-veg', mealType: 'lunch', day: 'Sunday' },
  { id: '52', name: 'Mutton Biryani', description: 'Fragrant rice with mutton', price: 290, type: 'non-veg', mealType: 'lunch', day: 'Sunday' },
  { id: '53', name: 'Vegetable Stew', description: 'Cooked vegetables in sauce', price: 120, type: 'veg', mealType: 'dinner', day: 'Sunday' },
  { id: '54', name: 'Lentil Soup', description: 'Creamy lentil soup', price: 100, type: 'veg', mealType: 'dinner', day: 'Sunday' },
  { id: '55', name: 'Fish Fry', description: 'Crispy fried fish', price: 280, type: 'non-veg', mealType: 'dinner', day: 'Sunday' },
  { id: '56', name: 'Crab Curry', description: 'Fresh crab in spiced curry', price: 320, type: 'non-veg', mealType: 'dinner', day: 'Sunday' },
];

export default function MenuScreen() {
  const [currentMenu, setCurrentMenu] = useState<MenuItem[]>([]);
  const [mealType, setMealType] = useState<'lunch' | 'dinner'>('lunch');
  const [dayName, setDayName] = useState<string>('');
  const [userPreference, setUserPreference] = useState<'veg' | 'non-veg'>('non-veg');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    loadMenuData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMenuData();
    }, [])
  );

  const parseTimeString = (timeStr: string): number => {
    // Parse time string like "12:00 PM" or "7:00 PM" to minutes since midnight
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    if (period === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }

    return totalMinutes;
  };

  const loadMenuData = async () => {
    try {
      // Get current day and time
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = days[now.getDay()];
      setDayName(currentDay);

      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      setCurrentTime(currentTimeStr);
      const currentTimeInMinutes = hours * 60 + minutes;

      // Get user's preferences to determine meal type based on their times
      const preferences = await loadPreferences();
      const todayPreference = preferences.find((p) => p.day === currentDay);

      let mealTypeToShow: 'lunch' | 'dinner' = 'lunch';
      let userPref: 'veg' | 'non-veg' = 'non-veg';

      if (todayPreference) {
        userPref = todayPreference.vegNonVeg;
        setUserPreference(userPref);

        // Parse lunch and dinner times
        const lunchTimeInMinutes = parseTimeString(todayPreference.lunchTime);
        const dinnerTimeInMinutes = parseTimeString(todayPreference.dinnerTime);

        // Determine meal type based on current time vs user's times
        if (currentTimeInMinutes >= dinnerTimeInMinutes) {
          // After dinner time - show dinner menu
          mealTypeToShow = 'dinner';
        } else if (currentTimeInMinutes >= lunchTimeInMinutes) {
          // After lunch time but before dinner time - show dinner menu
          mealTypeToShow = 'dinner';
        } else {
          // Before lunch time - show lunch menu
          mealTypeToShow = 'lunch';
        }
      }

      setMealType(mealTypeToShow);

      // Filter menu based on day, meal type, and preference
      const filteredMenu = FULL_MENU.filter(
        (item) =>
          item.day === currentDay &&
          item.mealType === mealTypeToShow &&
          item.type === userPref
      );

      setCurrentMenu(filteredMenu);
    } catch (error) {
      console.error('Error loading menu data:', error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'top']}>
      <ScrollView className="flex-1 bg-background">
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold">Today's Menu</Text>
            <View className="mt-3 flex-row items-center justify-between rounded-lg border border-border bg-card p-3">
              <View>
                <Text className="text-sm text-muted-foreground">
                  {dayName} • {currentTime}
                </Text>
                <Text className="mt-1 text-lg font-semibold">
                  {mealType === 'lunch' ? '🍽️ Lunch' : '🍽️ Dinner'}
                </Text>
              </View>
              <View className="rounded-full bg-primary px-3 py-1">
                <Text className="text-xs font-semibold text-primary-foreground">
                  {userPreference === 'veg' ? '🥬 Veg' : '🍗 Non-Veg'}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          {currentMenu.length === 0 ? (
            <View className="rounded-lg border border-border bg-card p-6">
              <Text className="text-center text-muted-foreground">
                No menu items available for your preference at this time.
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {currentMenu.map((item) => (
                <View key={item.id} className="rounded-lg border border-border bg-card p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold">{item.name}</Text>
                      <Text className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </Text>
                      <Text className="mt-3 text-lg font-bold text-primary">₹{item.price}</Text>
                    </View>
                    <View
                      className={`rounded px-2 py-1 ${item.type === 'veg' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                        }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${item.type === 'veg'
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                          }`}
                      >
                        {item.type === 'veg' ? '🥬' : '🍗'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Refresh Button */}
          <View className="mt-6" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
