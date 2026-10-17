import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Avatar, Button, Divider, List, Text, useTheme } from 'react-native-paper';
import { ApiError, DEMO } from '../api';
import type { Me } from '../models';
import { FREE_SAVED_LIMIT, useSaved } from '../store';
import { BIG } from '../theme';

export function AccountScreen({ me, onSignOut }: { me: Me; onSignOut: () => Promise<void> }) {
  const theme = useTheme();
  const saved = useSaved();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setBusy(true);
    setMessage(null);
    try {
      await saved.sync();
      setMessage('Đã đồng bộ.');
    } catch (e) {
      setMessage((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  const expires = me.expiresAt ? new Date(me.expiresAt).toLocaleDateString() : '-';

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={{ alignItems: 'center', marginVertical: 12 }}>
        <Avatar.Text size={72} label={(me.name || me.email).slice(0, 1).toUpperCase()} />
        <Text variant="titleLarge" style={{ marginTop: 10 }}>{me.name || me.email}</Text>
        <Text variant="bodyMedium">{me.email}</Text>
      </View>

      <View style={{ backgroundColor: me.premium ? theme.colors.tertiaryContainer : theme.colors.elevation.level3, borderRadius: BIG, padding: 20 }}>
        <Text variant="titleLarge">{me.premium ? 'Premium' : 'Gói miễn phí'}</Text>
        <Text style={{ marginTop: 6 }}>
          {me.premium
            ? DEMO ? 'Bản demo: mọi tính năng Premium đang mở.' : `Hết hạn / gia hạn: ${expires}`
            : `${me.quotaLimit} lượt/ngày · level B2 · 6 chủ đề · lưu tối đa ${FREE_SAVED_LIMIT} từ`}
        </Text>
      </View>

      {!me.premium && (
        <View style={{ marginTop: 16 }}>
          <Text>Premium: 30 lượt/ngày, level B2 + C1, chủ đề tự nhập, thẻ đầy đủ (IPA, collocations, ví dụ dịch), lưu không giới hạn, đồng bộ nhiều thiết bị.</Text>
          <Button mode="contained" disabled style={{ marginTop: 12, borderRadius: 999 }} contentStyle={{ height: 52 }}>
            Mua trong ứng dụng (sắp có)
          </Button>
        </View>
      )}

      {me.canSync && (
        <Button mode="outlined" icon="sync" onPress={sync} disabled={busy} style={{ marginTop: 16, borderRadius: 999 }} contentStyle={{ height: 52 }}>
          Đồng bộ từ đã lưu
        </Button>
      )}
      {message && <Text style={{ marginTop: 12 }}>{message}</Text>}

      <Divider style={{ marginVertical: 24 }} />
      {DEMO ? (
        <List.Item title="Bản demo" description="Dữ liệu mẫu trong máy, không cần tài khoản hay máy chủ." left={(p) => <List.Icon {...p} icon="information-outline" />} />
      ) : (
        <Button icon="logout" onPress={onSignOut}>Đăng xuất</Button>
      )}
    </ScrollView>
  );
}
