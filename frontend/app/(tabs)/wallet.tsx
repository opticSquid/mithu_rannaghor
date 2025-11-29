import { View, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: string;
}

interface DeliverySchedule {
  id: string;
  day: string;
  mealType: 'lunch' | 'dinner';
  itemPrice: number;
  itemName: string;
  status: 'pending' | 'delivered' | 'failed';
}

export default function WalletScreen() {
  const [balance, setBalance] = useState<number>(0);
  const [deliveryActive, setDeliveryActive] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [schedules, setSchedules] = useState<DeliverySchedule[]>([]);
  const [addMoneyAmount, setAddMoneyAmount] = useState<string>('');
  const [showAddMoney, setShowAddMoney] = useState<boolean>(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const savedBalance = await AsyncStorage.getItem('wallet-balance');
      const savedTransactions = await AsyncStorage.getItem('wallet-transactions');
      const savedDeliveryStatus = await AsyncStorage.getItem('delivery-active');
      const savedSchedules = await AsyncStorage.getItem('delivery-schedules');

      if (savedBalance) setBalance(parseFloat(savedBalance));
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
      if (savedDeliveryStatus) setDeliveryActive(JSON.parse(savedDeliveryStatus));
      if (savedSchedules) setSchedules(JSON.parse(savedSchedules));
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const saveWalletData = async (
    newBalance: number,
    newTransactions: Transaction[],
    newDeliveryStatus?: boolean
  ) => {
    try {
      await AsyncStorage.setItem('wallet-balance', newBalance.toString());
      await AsyncStorage.setItem('wallet-transactions', JSON.stringify(newTransactions));
      if (newDeliveryStatus !== undefined) {
        await AsyncStorage.setItem('delivery-active', JSON.stringify(newDeliveryStatus));
      }

      setBalance(newBalance);
      setTransactions(newTransactions);
    } catch (error) {
      console.error('Error saving wallet data:', error);
    }
  };

  const addMoney = () => {
    const amount = parseFloat(addMoneyAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    const newBalance = balance + amount;
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'credit',
      amount,
      description: 'Money added to wallet',
      timestamp: new Date().toLocaleString(),
    };

    saveWalletData(newBalance, [newTransaction, ...transactions]);
    setAddMoneyAmount('');
    setShowAddMoney(false);
    Alert.alert('Success', `₹${amount} added to wallet`);
  };

  const processDelivery = async (schedule: DeliverySchedule) => {
    if (!deliveryActive) {
      console.log('Delivery is paused, skipping delivery for:', schedule.itemName);
      return;
    }

    if (balance < schedule.itemPrice) {
      // Insufficient balance - delivery fails
      const updatedSchedules = schedules.map((s) =>
        s.id === schedule.id ? { ...s, status: 'failed' as const } : s
      );
      await AsyncStorage.setItem('delivery-schedules', JSON.stringify(updatedSchedules));
      setSchedules(updatedSchedules);

      Alert.alert(
        'Delivery Failed',
        `Insufficient balance for ${schedule.itemName}. Required: ₹${schedule.itemPrice}, Available: ₹${balance}`
      );
      return;
    }

    // Deduct from balance
    const newBalance = balance - schedule.itemPrice;
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'debit',
      amount: schedule.itemPrice,
      description: `${schedule.mealType.charAt(0).toUpperCase() + schedule.mealType.slice(1)} - ${schedule.itemName} (${schedule.day})`,
      timestamp: new Date().toLocaleString(),
    };

    // Mark delivery as delivered
    const updatedSchedules = schedules.map((s) =>
      s.id === schedule.id ? { ...s, status: 'delivered' as const } : s
    );

    await AsyncStorage.setItem('delivery-schedules', JSON.stringify(updatedSchedules));
    setSchedules(updatedSchedules);
    saveWalletData(newBalance, [newTransaction, ...transactions]);
  };

  const toggleDelivery = async (shouldActivate: boolean) => {
    setDeliveryActive(shouldActivate);
    try {
      await AsyncStorage.setItem('delivery-active', JSON.stringify(shouldActivate));
    } catch (error) {
      console.error('Error saving delivery status:', error);
    }
  };

  // Simulate upcoming deliveries
  const upcomingDeliveries: DeliverySchedule[] = [
    {
      id: '1',
      day: 'Monday',
      mealType: 'lunch',
      itemPrice: 150,
      itemName: 'Paneer Butter Masala',
      status: 'pending',
    },
    {
      id: '2',
      day: 'Monday',
      mealType: 'dinner',
      itemPrice: 200,
      itemName: 'Biryani',
      status: 'pending',
    },
    {
      id: '3',
      day: 'Tuesday',
      mealType: 'lunch',
      itemPrice: 120,
      itemName: 'Chole Bhature',
      status: 'pending',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'top']}>
      <ScrollView className="flex-1 bg-background">
        <View className="p-6">
          {/* Balance Card */}
          <View className="mb-6 rounded-lg border-2 border-primary bg-card p-6">
            <Text className="text-sm font-medium text-muted-foreground">Wallet Balance</Text>
            <Text className="mt-2 text-4xl font-bold text-primary">₹{balance.toFixed(2)}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              Delivery Status: {deliveryActive ? '✅ Active' : '⏸️ Paused'}
            </Text>
          </View>

          {/* Add Money Section */}
          {!showAddMoney && (
            <Pressable
              onPress={() => setShowAddMoney(true)}
              className="mb-6 rounded-lg bg-primary px-6 py-3"
            >
              <Text className="text-center font-semibold text-primary-foreground">
                + Add Money
              </Text>
            </Pressable>
          )}

          {showAddMoney && (
            <View className="mb-6 rounded-lg border border-border bg-card p-4">
              <Text className="mb-3 font-semibold">Add Money to Wallet</Text>
              <TextInput
                placeholder="Enter amount"
                placeholderTextColor="#999"
                value={addMoneyAmount}
                onChangeText={setAddMoneyAmount}
                keyboardType="decimal-pad"
                className="mb-3 rounded border border-input bg-background px-3 py-2 text-foreground"
              />
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setShowAddMoney(false)}
                  className="flex-1 rounded border border-border bg-background px-3 py-2"
                >
                  <Text className="text-center font-medium">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={addMoney}
                  className="flex-1 rounded bg-primary px-3 py-2"
                >
                  <Text className="text-center font-medium text-primary-foreground">Add</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Delivery Control */}
          <Pressable
            onPress={() => toggleDelivery(!deliveryActive)}
            className={`mb-6 rounded-lg px-6 py-4 ${deliveryActive ? 'bg-primary' : 'bg-destructive'
              }`}
          >
            <Text className="text-center text-lg font-semibold text-primary-foreground">
              {deliveryActive ? '⏸️ Pause Delivery' : '▶️ Resume Delivery'}
            </Text>
            <Text className="mt-2 text-center text-xs text-primary-foreground opacity-90">
              {deliveryActive
                ? 'Delivery is active. Tap to pause.'
                : 'Delivery is paused. Tap to resume.'}
            </Text>
          </Pressable>

          {/* Upcoming Deliveries */}
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold">Upcoming Deliveries</Text>
              <Pressable
                onPress={() => {
                  // Simulate processing a delivery
                  if (upcomingDeliveries.length > 0) {
                    processDelivery(upcomingDeliveries[0]);
                  }
                }}
                className="rounded bg-primary px-3 py-1"
              >
                <Text className="text-xs font-medium text-primary-foreground">Test Delivery</Text>
              </Pressable>
            </View>

            {upcomingDeliveries.map((delivery) => (
              <View key={delivery.id} className="mb-3 rounded-lg border border-border bg-card p-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="font-semibold">{delivery.itemName}</Text>
                    <Text className="mt-1 text-xs text-muted-foreground">
                      {delivery.day} • {delivery.mealType.toUpperCase()}
                    </Text>
                    <Text className="mt-2 text-sm font-medium">₹{delivery.itemPrice}</Text>
                  </View>
                  <View
                    className={`rounded px-2 py-1 ${delivery.itemPrice > balance ? 'bg-destructive' : 'bg-primary'
                      }`}
                  >
                    <Text className="text-xs font-medium text-primary-foreground">
                      {delivery.itemPrice > balance ? '❌ Low Balance' : '✅ Ready'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Transaction History */}
          <View>
            <Text className="mb-3 text-lg font-semibold">Transaction History</Text>
            {transactions.length === 0 ? (
              <View className="rounded-lg border border-border bg-card p-4">
                <Text className="text-center text-muted-foreground">No transactions yet</Text>
              </View>
            ) : (
              transactions.map((txn) => (
                <View key={txn.id} className="mb-2 flex-row items-center justify-between rounded-lg border border-border bg-card p-3">
                  <View className="flex-1">
                    <Text className="font-medium">{txn.description}</Text>
                    <Text className="mt-1 text-xs text-muted-foreground">{txn.timestamp}</Text>
                  </View>
                  <Text className={`font-semibold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
