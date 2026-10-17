import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';

import '../models.dart';

final FlutterTts _tts = FlutterTts()..setLanguage('en-US');

class WordCard extends StatelessWidget {
  const WordCard({super.key, required this.word, required this.saved, required this.onToggleSave});
  final VocabWord word;
  final bool saved;
  final VoidCallback onToggleSave;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Card(
      child: ExpansionTile(
        title: Text(word.word, style: t.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
        subtitle: Text([if (word.pos.isNotEmpty) word.pos, word.meaningVi].join(' · ')),
        trailing: Row(mainAxisSize: MainAxisSize.min, children: [
          IconButton(icon: const Icon(Icons.volume_up), tooltip: 'Phát âm', onPressed: () => _tts.speak(word.word)),
          IconButton(icon: Icon(saved ? Icons.bookmark : Icons.bookmark_border), tooltip: saved ? 'Bỏ lưu' : 'Lưu từ', onPressed: onToggleSave),
        ]),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        expandedCrossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (word.ipa.isNotEmpty) Text(word.ipa, style: t.bodyMedium?.copyWith(fontStyle: FontStyle.italic)),
          if (word.definitionEn.isNotEmpty) ...[const SizedBox(height: 6), Text(word.definitionEn)],
          const SizedBox(height: 8),
          Text('“${word.exampleEn}”'),
          if (word.exampleVi.isNotEmpty) Text(word.exampleVi, style: t.bodySmall),
          if (word.collocations.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(spacing: 6, runSpacing: 4, children: [for (final c in word.collocations) Chip(label: Text(c), visualDensity: VisualDensity.compact)]),
          ],
        ],
      ),
    );
  }
}
