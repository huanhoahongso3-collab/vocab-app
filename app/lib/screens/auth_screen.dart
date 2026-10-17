import 'package:flutter/material.dart';

import '../api.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.api, required this.onDone});
  final ApiClient api;
  final Future<void> Function() onDone;
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final email = TextEditingController(), password = TextEditingController(), name = TextEditingController();
  bool register = false, busy = false;
  String? error;

  Future<void> submit() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      if (register) {
        await widget.api.register(email.text.trim(), password.text, name.text.trim());
      } else {
        await widget.api.login(email.text.trim(), password.text);
      }
      await widget.onDone();
    } on ApiError catch (e) {
      setState(() => error = e.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> forgot() async {
    await showDialog<void>(context: context, builder: (_) => _ForgotDialog(api: widget.api, initialEmail: email.text.trim()));
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Text('Vocab B2 · C1', style: Theme.of(context).textTheme.headlineMedium, textAlign: TextAlign.center),
                  const SizedBox(height: 4),
                  const Text('Học từ vựng nâng cao theo chủ đề với AI', textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  if (register) ...[
                    TextField(controller: name, decoration: const InputDecoration(labelText: 'Tên hiển thị', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                  ],
                  TextField(
                    controller: email,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: password,
                    obscureText: true,
                    onSubmitted: (_) => submit(),
                    decoration: InputDecoration(labelText: 'Mật khẩu${register ? ' (tối thiểu 8 ký tự)' : ''}', border: const OutlineInputBorder()),
                  ),
                  if (error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(error!, style: TextStyle(color: Theme.of(context).colorScheme.error))),
                  const SizedBox(height: 16),
                  FilledButton(onPressed: busy ? null : submit, child: busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : Text(register ? 'Tạo tài khoản' : 'Đăng nhập')),
                  TextButton(onPressed: () => setState(() => register = !register), child: Text(register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký')),
                  if (!register) TextButton(onPressed: forgot, child: const Text('Quên mật khẩu?')),
                ]),
              ),
            ),
          ),
        ),
      );
}

class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key, required this.api, required this.email, required this.onDone, required this.onSignOut});
  final ApiClient api;
  final String email;
  final Future<void> Function() onDone, onSignOut;
  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final code = TextEditingController();
  bool busy = false;
  String? message;

  Future<void> verify() async {
    setState(() {
      busy = true;
      message = null;
    });
    try {
      await widget.api.verifyEmail(code.text.trim());
      await widget.onDone();
    } on ApiError catch (e) {
      setState(() => message = e.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> resend() async {
    try {
      await widget.api.resendVerification();
      setState(() => message = 'Đã gửi lại mã. Kiểm tra hộp thư (cả mục Spam).');
    } on ApiError catch (e) {
      setState(() => message = e.message);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Text('Xác minh email', style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  Text('Nhập mã 6 số đã gửi tới ${widget.email}', textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  TextField(
                    controller: code,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 24, letterSpacing: 8),
                    onSubmitted: (_) => verify(),
                    decoration: const InputDecoration(border: OutlineInputBorder(), counterText: ''),
                  ),
                  if (message != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(message!, textAlign: TextAlign.center)),
                  const SizedBox(height: 12),
                  FilledButton(onPressed: busy ? null : verify, child: const Text('Xác minh')),
                  TextButton(onPressed: resend, child: const Text('Gửi lại mã')),
                  TextButton(onPressed: widget.onSignOut, child: const Text('Dùng email khác')),
                ]),
              ),
            ),
          ),
        ),
      );
}

class _ForgotDialog extends StatefulWidget {
  const _ForgotDialog({required this.api, required this.initialEmail});
  final ApiClient api;
  final String initialEmail;
  @override
  State<_ForgotDialog> createState() => _ForgotDialogState();
}

class _ForgotDialogState extends State<_ForgotDialog> {
  late final email = TextEditingController(text: widget.initialEmail);
  final code = TextEditingController(), password = TextEditingController();
  bool codeSent = false, busy = false;
  String? message;

  Future<void> go() async {
    setState(() {
      busy = true;
      message = null;
    });
    try {
      if (!codeSent) {
        await widget.api.forgotPassword(email.text.trim());
        setState(() {
          codeSent = true;
          message = 'Nếu email tồn tại, mã đã được gửi.';
        });
      } else {
        await widget.api.resetPassword(email.text.trim(), code.text.trim(), password.text);
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã đổi mật khẩu. Hãy đăng nhập.')));
        }
      }
    } on ApiError catch (e) {
      setState(() => message = e.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: const Text('Đặt lại mật khẩu'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(controller: email, enabled: !codeSent, decoration: const InputDecoration(labelText: 'Email')),
          if (codeSent) ...[
            TextField(controller: code, keyboardType: TextInputType.number, maxLength: 6, decoration: const InputDecoration(labelText: 'Mã 6 số', counterText: '')),
            TextField(controller: password, obscureText: true, decoration: const InputDecoration(labelText: 'Mật khẩu mới (≥ 8 ký tự)')),
          ],
          if (message != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(message!)),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Đóng')),
          FilledButton(onPressed: busy ? null : go, child: Text(codeSent ? 'Đổi mật khẩu' : 'Gửi mã')),
        ],
      );
}
