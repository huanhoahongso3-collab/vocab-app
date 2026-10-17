import 'package:flutter/material.dart';

import '../api.dart';
import '../models.dart';
import '../store.dart';
import 'word_card.dart';

class GenerateScreen extends StatefulWidget {
  const GenerateScreen({super.key, required this.api, required this.store, required this.me, required this.onChanged});
  final ApiClient api;
  final SavedStore store;
  final Me me;
  final Future<void> Function() onChanged;
  @override
  State<GenerateScreen> createState() => _GenerateScreenState();
}

class _GenerateScreenState extends State<GenerateScreen> {
  String level = 'B2';
  String? topic;
  final custom = TextEditingController();
  List<String> topics = const [];
  List<VocabWord> words = const [];
  bool busy = false;
  String? error;

  @override
  void initState() {
    super.initState();
    widget.api.topics().then((t) {
      if (mounted) setState(() => topics = t);
    }).catchError((_) {});
    widget.store.addListener(_rebuild);
  }

  @override
  void dispose() {
    widget.store.removeListener(_rebuild);
    super.dispose();
  }

  void _rebuild() => setState(() {});

  String? get chosenTopic {
    final c = custom.text.trim();
    return c.isNotEmpty ? c : topic;
  }

  void _upsell(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$message Vào tab Tài khoản để nâng cấp Premium.')));
  }

  Future<void> generate() async {
    final t = chosenTopic;
    if (t == null) {
      setState(() => error = 'Hãy chọn hoặc nhập một chủ đề.');
      return;
    }
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final result = await widget.api.generate(level, t, widget.me.maxWordsPerGen);
      setState(() => words = result);
      await widget.onChanged(); // refresh remaining quota
    } on ApiError catch (e) {
      if (e.code == 'premium_required') {
        _upsell(e.message);
      } else {
        setState(() => error = e.code == 'quota_exceeded' ? 'Bạn đã dùng hết lượt hôm nay. Quay lại vào ngày mai hoặc nâng cấp Premium.' : e.message);
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> toggleSave(VocabWord w) async {
    if (widget.store.contains(w.id)) {
      await widget.store.remove(w.id);
    } else if (!await widget.store.save(w, premium: widget.me.premium)) {
      if (mounted) _upsell('Gói miễn phí lưu tối đa $freeSavedLimit từ.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = widget.me;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Chọn level', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        SegmentedButton<String>(
          segments: [
            const ButtonSegment(value: 'B2', label: Text('B2')),
            ButtonSegment(value: 'C1', label: const Text('C1'), icon: me.levels.contains('C1') ? null : const Icon(Icons.lock, size: 16)),
          ],
          selected: {level},
          onSelectionChanged: (s) {
            if (!me.levels.contains(s.first)) {
              _upsell('Level ${s.first} chỉ có trong Premium.');
              return;
            }
            setState(() => level = s.first);
          },
        ),
        const SizedBox(height: 16),
        Text('Chủ đề', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 4, children: [
          for (final t in topics)
            ChoiceChip(
              label: Text(t),
              selected: topic == t && custom.text.trim().isEmpty,
              onSelected: (_) => setState(() {
                topic = t;
                custom.clear();
              }),
            ),
        ]),
        const SizedBox(height: 8),
        TextField(
          controller: custom,
          enabled: me.customTopics,
          maxLength: 60,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            labelText: me.customTopics ? 'Hoặc nhập chủ đề bất kỳ' : 'Chủ đề tự nhập (Premium)',
            border: const OutlineInputBorder(),
            prefixIcon: me.customTopics ? null : const Icon(Icons.lock),
          ),
        ),
        const SizedBox(height: 8),
        FilledButton.icon(
          onPressed: busy ? null : generate,
          icon: busy ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.auto_awesome),
          label: Text(busy ? 'AI đang tạo…' : 'Tạo ${me.maxWordsPerGen} từ'),
        ),
        Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Text('Còn ${me.quotaRemaining}/${me.quotaLimit} lượt hôm nay', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
        ),
        if (error != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(error!, style: TextStyle(color: Theme.of(context).colorScheme.error))),
        const SizedBox(height: 8),
        for (final w in words) WordCard(word: w, saved: widget.store.contains(w.id), onToggleSave: () => toggleSave(w)),
      ],
    );
  }
}
