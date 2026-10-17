import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BottomNavigation, Button, PaperProvider, Snackbar, Text } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { ApiError, api, isLoggedIn, loadSession, logout } from './src/api';
import type { Me } from './src/models';
import { AccountScreen } from './src/screens/AccountScreen';
import { AuthScreen, VerifyEmailScreen } from './src/screens/AuthScreen';
import { GenerateScreen } from './src/screens/GenerateScreen';
import { SavedScreen } from './src/screens/SavedScreen';
import { SavedProvider, useSaved } from './src/store';
import { useAppTheme } from './src/theme';

export default function App() {
  const theme = useAppTheme();
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SavedProvider>
          <StatusBar style={theme.dark ? 'light' : 'dark'} />
          <Gate />
        </SavedProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

/** Decides between sign-in, email verification and the main app, based on the server's view of the user. */
function Gate() {
  const saved = useSaved();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadSession();
      setLoggedIn(isLoggedIn());
      if (isLoggedIn()) setMe(await api.me());
      else setMe(null);
    } catch (e) {
      const err = e as ApiError;
      // A network failure keeps the user signed in; any other error means the session is gone.
      if (err.code === 'network') setError(err.message);
      else {
        await logout();
        setLoggedIn(false);
        setMe(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await logout();
    await saved.clear();
    setMe(null);
    setLoggedIn(false);
  }, [saved]);

  if (loading) return <Center><ActivityIndicator size="large" /></Center>;
  if (!loggedIn) return <SafeAreaView style={{ flex: 1 }}><AuthScreen onDone={refresh} /></SafeAreaView>;
  if (!me) {
    return (
      <Center>
        <Text>{error ?? 'Không tải được tài khoản'}</Text>
        <Button mode="contained" onPress={refresh} style={{ marginTop: 12 }}>Thử lại</Button>
        <Button onPress={signOut}>Đăng xuất</Button>
      </Center>
    );
  }
  if (!me.emailVerified) return <SafeAreaView style={{ flex: 1 }}><VerifyEmailScreen email={me.email} onDone={refresh} onSignOut={signOut} /></SafeAreaView>;
  return <Home me={me} onChanged={async () => setMe(await api.me())} onSignOut={signOut} />;
}

function Center({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>{children}</View>;
}

function Home({ me, onChanged, onSignOut }: { me: Me; onChanged: () => Promise<void>; onSignOut: () => Promise<void> }) {
  const [index, setIndex] = useState(0);
  const [snack, setSnack] = useState<string | null>(null);
  const routes = [
    { key: 'gen', title: 'Tạo từ', focusedIcon: 'auto-fix', unfocusedIcon: 'auto-fix' },
    { key: 'saved', title: 'Đã lưu', focusedIcon: 'bookmark', unfocusedIcon: 'bookmark-outline' },
    { key: 'account', title: 'Tài khoản', focusedIcon: 'account-circle', unfocusedIcon: 'account-circle-outline' },
  ];
  return (
    <>
      <BottomNavigation
        navigationState={{ index, routes }}
        onIndexChange={setIndex}
        sceneAnimationEnabled
        renderScene={({ route }) =>
          route.key === 'gen' ? (
            <GenerateScreen me={me} onChanged={onChanged} notify={setSnack} />
          ) : route.key === 'saved' ? (
            <SavedScreen />
          ) : (
            <AccountScreen me={me} onSignOut={onSignOut} />
          )
        }
      />
      <Snackbar visible={!!snack} onDismiss={() => setSnack(null)} duration={4000} style={{ borderRadius: 20 }}>
        {snack ?? ''}
      </Snackbar>
    </>
  );
}
