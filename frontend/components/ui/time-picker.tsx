import { View, Pressable, TextInput, Modal } from 'react-native';
import { Text } from '@/components/ui/text';
import { useState } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label: string;
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempInput, setTempInput] = useState(value);
  const [hours, setHours] = useState(getHoursFromTime(value));
  const [minutes, setMinutes] = useState(getMinutesFromTime(value));
  const [period, setPeriod] = useState(getPeriodFromTime(value));

  function getHoursFromTime(timeStr: string): string {
    const [time] = timeStr.split(' ');
    return time.split(':')[0];
  }

  function getMinutesFromTime(timeStr: string): string {
    const [time] = timeStr.split(' ');
    return time.split(':')[1];
  }

  function getPeriodFromTime(timeStr: string): string {
    return timeStr.includes('PM') ? 'PM' : 'AM';
  }

  const formatTime = (h: string, m: string, p: string): string => {
    const hoursNum = parseInt(h) || 0;
    const minutesNum = parseInt(m) || 0;

    if (hoursNum < 1 || hoursNum > 12 || minutesNum < 0 || minutesNum > 59) {
      return value;
    }

    return `${String(hoursNum).padStart(2, '0')}:${String(minutesNum).padStart(2, '0')} ${p}`;
  };

  const handleConfirm = () => {
    const formattedTime = formatTime(hours, minutes, period);
    onChange(formattedTime);
    setShowPicker(false);
  };

  const handleManualInput = () => {
    // Validate basic time format (HH:MM AM/PM)
    if (tempInput.match(/^\d{1,2}:\d{2}\s(AM|PM)$/i)) {
      onChange(tempInput.toUpperCase());
      setShowPicker(false);
      setHours(getHoursFromTime(tempInput.toUpperCase()));
      setMinutes(getMinutesFromTime(tempInput.toUpperCase()));
      setPeriod(getPeriodFromTime(tempInput.toUpperCase()));
    }
  };

  return (
    <View>
      <Text className="mb-2 text-xs font-medium">{label}</Text>
      <Pressable
        onPress={() => {
          setShowPicker(true);
          setTempInput(value);
        }}
        className="flex-row items-center justify-between rounded border border-border bg-background px-3 py-2"
      >
        <Text className="text-xs">{value}</Text>
        <Text className="text-lg">🕐</Text>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="w-4/5 rounded-lg bg-card p-6">
            <Text className="mb-4 text-lg font-semibold">{label}</Text>

            {/* Manual Input */}
            <View className="mb-4">
              <Text className="mb-2 text-xs font-medium">Enter Time (HH:MM AM/PM)</Text>
              <View className="flex-row gap-2">
                <TextInput
                  placeholder="12:30 PM"
                  placeholderTextColor="#999"
                  value={tempInput}
                  onChangeText={setTempInput}
                  className="flex-1 rounded border border-input bg-background px-3 py-2 text-foreground"
                />
                <Pressable
                  onPress={handleManualInput}
                  className="rounded bg-primary px-4 py-2"
                >
                  <Text className="font-medium text-primary-foreground">Set</Text>
                </Pressable>
              </View>
            </View>

            {/* Divider */}
            <View className="mb-4 h-px bg-border" />

            {/* Time Picker Sliders */}
            <View className="mb-6">
              <Text className="mb-3 text-center text-sm font-medium">
                {String(parseInt(hours) || 0).padStart(2, '0')}:
                {String(parseInt(minutes) || 0).padStart(2, '0')} {period}
              </Text>

              {/* Hours */}
              <View className="mb-4">
                <Text className="mb-2 text-xs text-muted-foreground">Hours</Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => setHours(String(Math.max(1, (parseInt(hours) || 1) - 1)))}
                    className="rounded bg-secondary px-3 py-2"
                  >
                    <Text className="font-bold">−</Text>
                  </Pressable>
                  <TextInput
                    value={hours}
                    onChangeText={setHours}
                    keyboardType="numeric"
                    maxLength={2}
                    className="flex-1 rounded border border-input bg-background px-2 py-2 text-center text-foreground"
                  />
                  <Pressable
                    onPress={() => setHours(String(Math.min(12, (parseInt(hours) || 0) + 1)))}
                    className="rounded bg-secondary px-3 py-2"
                  >
                    <Text className="font-bold">+</Text>
                  </Pressable>
                </View>
              </View>

              {/* Minutes */}
              <View className="mb-4">
                <Text className="mb-2 text-xs text-muted-foreground">Minutes</Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() =>
                      setMinutes(String(Math.max(0, (parseInt(minutes) || 0) - 5)).padStart(2, '0'))
                    }
                    className="rounded bg-secondary px-3 py-2"
                  >
                    <Text className="font-bold">−</Text>
                  </Pressable>
                  <TextInput
                    value={String(parseInt(minutes) || 0).padStart(2, '0')}
                    onChangeText={setMinutes}
                    keyboardType="numeric"
                    maxLength={2}
                    className="flex-1 rounded border border-input bg-background px-2 py-2 text-center text-foreground"
                  />
                  <Pressable
                    onPress={() =>
                      setMinutes(String(Math.min(59, (parseInt(minutes) || 0) + 5)).padStart(2, '0'))
                    }
                    className="rounded bg-secondary px-3 py-2"
                  >
                    <Text className="font-bold">+</Text>
                  </Pressable>
                </View>
              </View>

              {/* AM/PM */}
              <View>
                <Text className="mb-2 text-xs text-muted-foreground">Period</Text>
                <View className="flex-row gap-2">
                  {['AM', 'PM'].map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setPeriod(p)}
                      className={`flex-1 rounded px-3 py-2 ${
                        period === p ? 'bg-primary' : 'border border-border bg-background'
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          period === p ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {p}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setShowPicker(false)}
                className="flex-1 rounded border border-border bg-background px-4 py-3"
              >
                <Text className="text-center font-medium">Cancel</Text>
              </Pressable>
              <Pressable onPress={handleConfirm} className="flex-1 rounded bg-primary px-4 py-3">
                <Text className="text-center font-medium text-primary-foreground">Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
