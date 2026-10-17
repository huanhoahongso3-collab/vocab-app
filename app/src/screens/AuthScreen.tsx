import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { ApiError, api } from '../api';
import { BIG } from '../theme';

const field = { outlineStyle: { borderRadius: BIG }, mode: 'outlined' as const, style: { marginTop: 12 } };
const pill = { borderRadius: 999 };

export function AuthScreen({ onDone }: { onDone: () => Promise<void> }) {
  const theme = useTheme();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (register) await api.register(email.trim(), password, name.trim());
      else await api.login(email.trim(), password);
      await onDone();
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text variant="headlineMedium" style={{ textAlign: 'center' }}>Vocab B2 · C1</Text>
        <Text style={{ textAlign: 'center', marginTop: 4, marginBottom: 16 }}>Học từ vựng nâng cao theo chủ đề với AI</Text>
        {register && <TextInput {...field} label="Tên hiển thị" value={name} onChangeText={setName} />}
        <TextInput {...field} label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <TextInput
          {...field}
          label={register ? 'Mật khẩu (tối thiểu 8 ký tự)' : 'Mật khẩu'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onSubmitEditing={submit}
        />
        {error && <HelperText type="error" visible>{error}</HelperText>}
        <Button mode="contained" onPress={submit} disabled={busy} loading={busy} style={{ ...pill, marginTop: 16 }} contentStyle={{ height: 54 }}>
          {register ? 'Tạo tài khoản' : 'Đăng nhập'}
        </Button>
        <Button onPress={() => setRegister(!register)} style={{ marginTop: 8 }}>
          {register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
        </Button>
        {!register && <Button onPress={() => setForgot(true)}>Quên mật khẩu?</Button>}
      </ScrollView>
      <ForgotDialog visible={forgot} initialEmail={email.trim()} onClose={() => setForgot(false)} />
    </KeyboardAvoidingView>
  );
}

export function VerifyEmailScreen({ email, onDone, onSignOut }: { email: string; onDone: () => Promise<void>; onSignOut: () => Promise<void> }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function verify() {
    setBusy(true);
    setMessage(null);
    try {
      await api.verifyEmail(code.trim());
      await onDone();
    } catch (e) {
      setMessage((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    try {
      await api.resendVerification();
      setMessage('Đã gửi lại mã. Kiểm tra hộp thư (cả mục Spam).');
    } catch (e) {
      setMessage((e as ApiError).message);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text variant="headlineSmall" style={{ textAlign: 'center' }}>Xác minh email</Text>
      <Text style={{ textAlign: 'center', marginTop: 8 }}>Nhập mã 6 số đã gửi tới {email}</Text>
      <TextInput
        {...field}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        onSubmitEditing={verify}
        contentStyle={{ textAlign: 'center', fontSize: 26, letterSpacing: 8 }}
      />
      {message && <HelperText type="info" visible>{message}</HelperText>}
      <Button mode="contained" onPress={verify} disabled={busy || code.length !== 6} style={{ ...pill, marginTop: 12 }} contentStyle={{ height: 54 }}>
        Xác minh
      </Button>
      <Button onPress={resend}>Gửi lại mã</Button>
      <Button onPress={onSignOut}>Dùng email khác</Button>
    </View>
  );
}

function ForgotDialog({ visible, initialEmail, onClose }: { visible: boolean; initialEmail: string; onClose: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setMessage(null);
    try {
      if (!codeSent) {
        await api.forgotPassword(email.trim());
        setCodeSent(true);
        setMessage('Nếu email tồn tại, mã đã được gửi.');
      } else {
        await api.resetPassword(email.trim(), code.trim(), password);
        setCodeSent(false);
        setCode('');
        setPassword('');
        onClose();
      }
    } catch (e) {
      setMessage((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={{ borderRadius: BIG }}>
        <Dialog.Title>Đặt lại mật khẩu</Dialog.Title>
        <Dialog.Content>
          <TextInput mode="outlined" label="Email" value={email} onChangeText={setEmail} editable={!codeSent} autoCapitalize="none" keyboardType="email-address" />
          {codeSent && (
            <>
              <TextInput mode="outlined" label="Mã 6 số" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} style={{ marginTop: 8 }} />
              <TextInput mode="outlined" label="Mật khẩu mới (≥ 8 ký tự)" value={password} onChangeText={setPassword} secureTextEntry style={{ marginTop: 8 }} />
            </>
          )}
          {message && <HelperText type="info" visible>{message}</HelperText>}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose}>Đóng</Button>
          <Button mode="contained" onPress={go} disabled={busy}>{codeSent ? 'Đổi mật khẩu' : 'Gửi mã'}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
