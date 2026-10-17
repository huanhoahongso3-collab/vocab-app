import 'package:flutter/material.dart';

import '../store.dart';
import 'word_card.dart';

class SavedScreen extends StatelessWidget {
  const SavedScreen({super.key, required this.store});
  final SavedStore store;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: store,
        builder: (context, _) {
          final words = store.words;
          if (words.isEmpty) return const Center(child: Text('Chưa có từ nào. Bấm biểu tượng đánh dấu để lưu từ.'));
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text('${words.length} từ đã lưu', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              for (final w in words) WordCard(word: w, saved: true, onToggleSave: () => store.remove(w.id)),
            ],
          );
        },
      );
}
