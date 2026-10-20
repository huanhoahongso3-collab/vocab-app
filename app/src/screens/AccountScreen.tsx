import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Chip, Divider, HelperText, IconButton, List, SegmentedButtons, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { ApiError, DEMO } from '../api';
import type { Me } from '../models';
import { FREE_SAVED_LIMIT, useSaved } from '../store';
import { BIG } from '../theme';

export function AccountScreen({ me, onSignOut }: { me: Me; onSignOut: () => Promise<void> }) {
  const theme = useTheme();
  const { words, docs, reminder, updateReminder, settings, updateSettings, lang, setLang, t, clear } = useSaved();

  const [reminderTime, setReminderTime] = useState(reminder.time || '20:00');
  const [reminderMsg, setReminderMsg] = useState(reminder.message || 'Đã đến giờ ôn lại từ vựng hôm nay! 🚀');
  const [streakInput, setStreakInput] = useState(String(reminder.streakDays || 1));
  const [goalInput, setGoalInput] = useState(String(reminder.dailyGoal || 10));
  const [savedNotif, setSavedNotif] = useState(false);

  const masteredCount = words.filter((w) => w.mastered).length;

  const handleSaveReminder = async () => {
    const s = parseInt(streakInput, 10);
    const g = parseInt(goalInput, 10);
    await updateReminder({
      time: reminderTime.trim() || '20:00',
      message: reminderMsg.trim(),
      streakDays: isNaN(s) ? 1 : Math.max(0, s),
      dailyGoal: isNaN(g) ? 10 : Math.max(1, g),
    });
    setSavedNotif(true);
    setTimeout(() => setSavedNotif(false), 3000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Profile Header */}
      <View style={styles.profileBox}>
        <Avatar.Text size={72} label={(me.name || me.email).slice(0, 1).toUpperCase()} />
        <Text variant="titleLarge" style={styles.userName}>{me.name || me.email}</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>{me.email}</Text>
        <Chip icon="check-decagram" style={styles.demoBadge}>
          {t('demoBadge')}
        </Chip>
      </View>

      {/* LANGUAGE SELECTOR */}
      <Card style={styles.card}>
        <Card.Title
          title={t('langSection')}
          left={(p) => <List.Icon {...p} icon="translate" />}
        />
        <Card.Content>
          <SegmentedButtons
            value={lang}
            onValueChange={(val) => setLang(val as 'vi' | 'en')}
            buttons={[
              { value: 'vi', label: t('langVi'), icon: 'flag-variant' },
              { value: 'en', label: t('langEn'), icon: 'earth' },
            ]}
          />
        </Card.Content>
      </Card>

      {/* REMINDER & STREAK CUSTOMIZATION */}
      <Card style={styles.card}>
        <Card.Title
          title={t('reminderSection')}
          left={(p) => <List.Icon {...p} icon="bell-ring-outline" />}
        />
        <Card.Content>
          {/* Enable Switch */}
          <View style={styles.switchRow}>
            <Text variant="bodyLarge" style={{ fontWeight: '600' }}>{t('reminderToggle')}</Text>
            <Switch
              value={reminder.enabled}
              onValueChange={(val) => updateReminder({ enabled: val })}
            />
          </View>

          {/* Time Customization */}
          <Text variant="labelMedium" style={styles.fieldLabel}>{t('reminderTimeLabel')}</Text>
          <TextInput
            mode="outlined"
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="20:00"
            left={<TextInput.Icon icon="clock-outline" />}
            style={styles.inputField}
          />

          {/* Quick Time Presets */}
          <View style={styles.presetRow}>
            {['08:00', '12:30', '19:00', '20:00', '21:30'].map((timePreset) => (
              <Chip
                key={timePreset}
                compact
                selected={reminderTime === timePreset}
                onPress={() => setReminderTime(timePreset)}
                style={styles.presetChip}
              >
                {timePreset}
              </Chip>
            ))}
          </View>

          {/* Reminder Message Customization */}
          <Text variant="labelMedium" style={styles.fieldLabel}>{t('reminderMessageLabel')}</Text>
          <TextInput
            mode="outlined"
            value={reminderMsg}
            onChangeText={setReminderMsg}
            placeholder="Nội dung thông báo..."
            left={<TextInput.Icon icon="message-text-outline" />}
            style={styles.inputField}
          />

          {/* Streak & Goal Customization */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <Text variant="labelMedium" style={styles.fieldLabel}>{t('streakLabel')}</Text>
              <TextInput
                mode="outlined"
                value={streakInput}
                onChangeText={setStreakInput}
                keyboardType="numeric"
                left={<TextInput.Icon icon="fire" />}
                style={styles.inputField}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="labelMedium" style={styles.fieldLabel}>{t('dailyGoalLabel')}</Text>
              <TextInput
                mode="outlined"
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="numeric"
                left={<TextInput.Icon icon="target" />}
                style={styles.inputField}
              />
            </View>
          </View>

          {/* Auto Speak Toggle */}
          <View style={[styles.switchRow, { marginTop: 12 }]}>
            <Text variant="bodyMedium">{t('autoSpeakToggle')}</Text>
            <Switch
              value={reminder.autoSpeak}
              onValueChange={(val) => updateReminder({ autoSpeak: val })}
            />
          </View>

          {savedNotif && (
            <HelperText type="info" visible style={{ color: '#2E7D32', fontWeight: '700' }}>
              {t('btnSaveSettings')}
            </HelperText>
          )}

          <Button
            mode="contained"
            icon="content-save-outline"
            onPress={handleSaveReminder}
            style={{ marginTop: 12, borderRadius: 999 }}
          >
            Lưu cài đặt nhắc nhở
          </Button>
        </Card.Content>
      </Card>

      {/* VOCABULARY STATS */}
      <Card style={styles.card}>
        <Card.Title
          title={t('statsSection')}
          left={(p) => <List.Icon {...p} icon="chart-bar" />}
        />
        <Card.Content>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: theme.colors.elevation.level2 }]}>
              <Text variant="headlineSmall" style={{ fontWeight: '800', color: theme.colors.primary }}>
                {words.length}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                {t('totalSaved')}
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.elevation.level2 }]}>
              <Text variant="headlineSmall" style={{ fontWeight: '800', color: '#2E7D32' }}>
                {masteredCount}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                {t('totalMastered')}
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.elevation.level2 }]}>
              <Text variant="headlineSmall" style={{ fontWeight: '800', color: '#5E35B1' }}>
                {docs.length}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                {t('totalDocs')}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <Divider style={{ marginVertical: 16 }} />

      {/* Reset Data */}
      <Button
        mode="outlined"
        icon="refresh"
        textColor="#D32F2F"
        onPress={clear}
        style={{ borderRadius: 999 }}
      >
        {t('btnResetData')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 60,
  },
  profileBox: {
    alignItems: 'center',
    marginVertical: 10,
  },
  userName: {
    fontWeight: '800',
    marginTop: 8,
  },
  demoBadge: {
    marginTop: 8,
    backgroundColor: '#E8F5E9',
  },
  card: {
    borderRadius: BIG,
    marginBottom: 16,
    elevation: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  fieldLabel: {
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  inputField: {
    marginBottom: 4,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  presetChip: {
    borderRadius: 999,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
  },
});

