import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api.dart';
import 'models.dart';

const freeSavedLimit = 100;

/// Offline-first saved words: every change is written locally first, then pushed by [sync]
/// (Premium only). Conflicts are resolved last-write-wins on `updatedAt`, same as the server.
class SavedStore extends ChangeNotifier {
  SavedStore._(this._prefs, this._all);

  final SharedPreferences _prefs;
  final Map<String, VocabWord> _all;

  static Future<SavedStore> load() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString('saved_words');
    final map = <String, VocabWord>{};
    if (raw != null) {
      for (final j in (jsonDecode(raw) as List)) {
        final w = VocabWord.fromJson((j as Map).cast<String, dynamic>());
        map[w.id] = w;
      }
    }
    return SavedStore._(p, map);
  }

  List<VocabWord> get words =>
      _all.values.where((w) => !w.deleted).toList()..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

  bool contains(String id) => _all[id] != null && !_all[id]!.deleted;

  Future<void> _persist() async {
    await _prefs.setString('saved_words', jsonEncode(_all.values.map((w) => w.toJson()).toList()));
    notifyListeners();
  }

  /// Returns false when the free-plan limit is reached.
  Future<bool> save(VocabWord w, {required bool premium}) async {
    if (!contains(w.id) && !premium && words.length >= freeSavedLimit) return false;
    _all[w.id] = VocabWord.fromSync(w.id, w.toData(), DateTime.now().millisecondsSinceEpoch, false);
    await _persist();
    return true;
  }

  Future<void> remove(String id) async {
    final w = _all[id];
    if (w == null) return;
    _all[id] = w.markDeleted();
    await _persist();
  }

  Future<void> clearOnLogout() async {
    _all.clear();
    await _prefs.remove('saved_words');
    await _prefs.remove('sync_cursor');
    await _prefs.remove('sync_pushed');
    notifyListeners();
  }

  /// Pushes local changes newer than the last push and merges what the server returns.
  Future<void> sync(ApiClient api) async {
    final pushedAt = _prefs.getInt('sync_pushed') ?? 0;
    final cursor = _prefs.getInt('sync_cursor') ?? 0;
    final startedAt = DateTime.now().millisecondsSinceEpoch;
    final res = await api.sync(cursor, _all.values.where((w) => w.updatedAt > pushedAt).toList());
    for (final remote in res.changes) {
      final local = _all[remote.id];
      if (local == null || remote.updatedAt >= local.updatedAt) _all[remote.id] = remote;
    }
    await _prefs.setInt('sync_cursor', res.cursor);
    await _prefs.setInt('sync_pushed', startedAt);
    await _persist();
  }
}
