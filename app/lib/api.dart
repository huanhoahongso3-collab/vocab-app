import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'demo_data.dart';
import 'models.dart';

/// Override at build time: flutter run --dart-define=API_URL=https://api.example.com
/// (10.0.2.2 is the host machine as seen from the Android emulator.)
const apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:3000');

/// Demo build: flutter build apk --dart-define=DEMO=true. No login, no server, sample data only.
const demoMode = bool.fromEnvironment('DEMO');

class ApiError implements Exception {
  ApiError(this.code, this.message, {this.status});
  final String code, message;
  final int? status;
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient._(this._prefs) {
    _dio = Dio(BaseOptions(baseUrl: apiUrl, connectTimeout: const Duration(seconds: 15), receiveTimeout: const Duration(seconds: 90)));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (o, h) {
        if (_access != null) o.headers['Authorization'] = 'Bearer $_access';
        h.next(o);
      },
      onError: (e, h) async {
        final retried = e.requestOptions.extra['retried'] == true;
        if (e.response?.statusCode == 401 && !retried && _refresh != null && !e.requestOptions.path.startsWith('/auth/')) {
          if (await _refreshTokens()) {
            final o = e.requestOptions..extra['retried'] = true;
            o.headers['Authorization'] = 'Bearer $_access';
            try {
              return h.resolve(await _dio.fetch(o));
            } on DioException catch (e2) {
              return h.next(e2);
            }
          }
        }
        h.next(e);
      },
    ));
  }

  static Future<ApiClient> create() async {
    final c = ApiClient._(await SharedPreferences.getInstance());
    c._access = c._prefs.getString('access');
    c._refresh = c._prefs.getString('refresh');
    return c;
  }

  final SharedPreferences _prefs;
  late final Dio _dio;
  String? _access, _refresh;

  bool get loggedIn => demoMode || _refresh != null;

  Future<void> _setTokens(Map<String, dynamic> j) async {
    _access = j['access_token'] as String;
    _refresh = j['refresh_token'] as String;
    await _prefs.setString('access', _access!);
    await _prefs.setString('refresh', _refresh!);
  }

  Future<bool> _refreshTokens() async {
    try {
      final r = await Dio(BaseOptions(baseUrl: apiUrl)).post('/auth/refresh', data: {'refresh_token': _refresh});
      await _setTokens(r.data as Map<String, dynamic>);
      return true;
    } catch (_) {
      await logout();
      return false;
    }
  }

  Future<void> logout() async {
    _access = _refresh = null;
    await _prefs.remove('access');
    await _prefs.remove('refresh');
  }

  Future<T> _call<T>(Future<Response<dynamic>> Function() f, T Function(dynamic) map) async {
    try {
      return map((await f()).data);
    } on DioException catch (e) {
      final d = e.response?.data;
      if (d is Map && d['error'] != null) {
        throw ApiError(d['error'] as String, (d['message'] ?? d['error']) as String, status: e.response?.statusCode);
      }
      throw ApiError('network', 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
    }
  }

  // ---- auth ----
  Future<void> register(String email, String password, String name) =>
      _call(() => _dio.post('/auth/register', data: {'email': email, 'password': password, 'name': name}), (d) => _setTokens(d as Map<String, dynamic>));
  Future<void> login(String email, String password) =>
      _call(() => _dio.post('/auth/login', data: {'email': email, 'password': password}), (d) => _setTokens(d as Map<String, dynamic>));
  Future<void> verifyEmail(String code) => _call(() => _dio.post('/auth/verify-email', data: {'code': code}), (_) {});
  Future<void> resendVerification() => _call(() => _dio.post('/auth/resend-verification'), (_) {});
  Future<void> forgotPassword(String email) => _call(() => _dio.post('/auth/forgot-password', data: {'email': email}), (_) {});
  Future<void> resetPassword(String email, String code, String newPassword) =>
      _call(() => _dio.post('/auth/reset-password', data: {'email': email, 'code': code, 'new_password': newPassword}), (_) {});

  // ---- data ----
  Future<Me> me() => demoMode ? Future.value(Me.demo()) : _call(() => _dio.get('/me'), (d) => Me.fromJson(d as Map<String, dynamic>));
  Future<List<String>> topics() => demoMode ? Future.value(demoTopics) : _call(() => _dio.get('/vocab/topics'), (d) => ((d as Map)['topics'] as List).cast<String>());

  Future<List<VocabWord>> generate(String level, String topic, int count) async {
    if (demoMode) {
      await Future<void>.delayed(const Duration(milliseconds: 900)); // feel like a real request
      return demoGenerate(level, topic, count);
    }
    return _generate(level, topic, count);
  }

  Future<List<VocabWord>> _generate(String level, String topic, int count) => _call(
        () => _dio.post('/vocab/generate', data: {'level': level, 'topic': topic, 'count': count}),
        (d) => ((d as Map)['words'] as List)
            .map((w) => VocabWord.fromApi((w as Map).cast<String, dynamic>(), level: level, topic: topic))
            .toList(),
      );

  Future<({int cursor, List<VocabWord> changes})> sync(int since, List<VocabWord> changes) => _call(
        () => _dio.post('/sync', data: {'since': since, 'changes': changes.map((w) => w.toJson()).toList()}),
        (d) {
          final m = d as Map<String, dynamic>;
          return (
            cursor: m['cursor'] as int,
            changes: (m['changes'] as List).map((c) => VocabWord.fromJson((c as Map).cast<String, dynamic>())).toList(),
          );
        },
      );

  // ---- billing ----
  Future<Me> verifyGoogle(String productId, String purchaseToken) => _call(
        () => _dio.post('/billing/google/verify', data: {'product_id': productId, 'purchase_token': purchaseToken}),
        (d) => Me.fromJson(d as Map<String, dynamic>),
      );
  Future<Me> verifyApple(String transactionId) => _call(
        () => _dio.post('/billing/apple/verify', data: {'transaction_id': transactionId}),
        (d) => Me.fromJson(d as Map<String, dynamic>),
      );
}
