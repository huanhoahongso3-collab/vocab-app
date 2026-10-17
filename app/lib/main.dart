import 'package:flutter/material.dart';

import 'api.dart';
import 'models.dart';
import 'screens/account_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/generate_screen.dart';
import 'screens/saved_screen.dart';
import 'store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final api = await ApiClient.create();
  final store = await SavedStore.load();
  runApp(VocabApp(api: api, store: store));
}

class VocabApp extends StatelessWidget {
  const VocabApp({super.key, required this.api, required this.store});
  final ApiClient api;
  final SavedStore store;

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'Vocab B2/C1',
        theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true),
        darkTheme: ThemeData(colorSchemeSeed: Colors.indigo, brightness: Brightness.dark, useMaterial3: true),
        home: Gate(api: api, store: store),
      );
}

/// Decides between sign-in, email verification and the main app, based on the server's view of the user.
class Gate extends StatefulWidget {
  const Gate({super.key, required this.api, required this.store});
  final ApiClient api;
  final SavedStore store;
  @override
  State<Gate> createState() => _GateState();
}

class _GateState extends State<Gate> {
  Me? me;
  bool loading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    refresh();
  }

  Future<void> refresh() async {
    if (!widget.api.loggedIn) {
      setState(() {
        me = null;
        loading = false;
      });
      return;
    }
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final m = await widget.api.me();
      setState(() => me = m);
    } on ApiError catch (e) {
      // Network failure keeps the user signed in (offline use); other errors mean the session is gone.
      if (e.code == 'network') {
        error = e.message;
      } else {
        await widget.api.logout();
        me = null;
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> signOut() async {
    await widget.api.logout();
    await widget.store.clearOnLogout();
    setState(() => me = null);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (!widget.api.loggedIn) return AuthScreen(api: widget.api, onDone: refresh);
    final m = me;
    if (m == null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text(error ?? 'Không tải được tài khoản'),
              const SizedBox(height: 12),
              FilledButton(onPressed: refresh, child: const Text('Thử lại')),
              TextButton(onPressed: signOut, child: const Text('Đăng xuất')),
            ]),
          ),
        ),
      );
    }
    if (!m.emailVerified) return VerifyEmailScreen(api: widget.api, email: m.email, onDone: refresh, onSignOut: signOut);
    return HomeShell(api: widget.api, store: widget.store, me: m, onChanged: refresh, onSignOut: signOut);
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.api, required this.store, required this.me, required this.onChanged, required this.onSignOut});
  final ApiClient api;
  final SavedStore store;
  final Me me;
  final Future<void> Function() onChanged;
  final Future<void> Function() onSignOut;
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int tab = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      GenerateScreen(api: widget.api, store: widget.store, me: widget.me, onChanged: widget.onChanged),
      SavedScreen(store: widget.store),
      AccountScreen(api: widget.api, store: widget.store, me: widget.me, onChanged: widget.onChanged, onSignOut: widget.onSignOut),
    ];
    return Scaffold(
      body: SafeArea(child: IndexedStack(index: tab, children: pages)),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (i) => setState(() => tab = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.auto_awesome), label: 'Tạo từ'),
          NavigationDestination(icon: Icon(Icons.bookmark), label: 'Đã lưu'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Tài khoản'),
        ],
      ),
    );
  }
}
