class VocabWord {
  VocabWord({
    required this.id,
    required this.word,
    this.ipa = '',
    this.pos = '',
    this.meaningVi = '',
    this.definitionEn = '',
    this.exampleEn = '',
    this.exampleVi = '',
    this.collocations = const [],
    this.level = 'B2',
    this.topic = '',
    required this.updatedAt,
    this.deleted = false,
  });

  /// Deterministic id so the same word saved on two devices merges instead of duplicating.
  static String makeId(String level, String word) => '$level:${word.trim().toLowerCase()}';

  final String id;
  final String word, ipa, pos, meaningVi, definitionEn, exampleEn, exampleVi, level, topic;
  final List<String> collocations;
  final int updatedAt;
  final bool deleted;

  factory VocabWord.fromApi(Map<String, dynamic> j, {required String level, required String topic}) => VocabWord(
        id: makeId(level, j['word'] as String),
        word: j['word'] as String,
        ipa: (j['ipa'] ?? '') as String,
        pos: (j['pos'] ?? '') as String,
        meaningVi: (j['meaning_vi'] ?? '') as String,
        definitionEn: (j['definition_en'] ?? '') as String,
        exampleEn: (j['example_en'] ?? '') as String,
        exampleVi: (j['example_vi'] ?? '') as String,
        collocations: ((j['collocations'] ?? const []) as List).cast<String>(),
        level: level,
        topic: topic,
        updatedAt: DateTime.now().millisecondsSinceEpoch,
      );

  /// The `data` blob stored on the server and in local storage.
  Map<String, dynamic> toData() => {
        'word': word,
        'ipa': ipa,
        'pos': pos,
        'meaning_vi': meaningVi,
        'definition_en': definitionEn,
        'example_en': exampleEn,
        'example_vi': exampleVi,
        'collocations': collocations,
        'level': level,
        'topic': topic,
      };

  factory VocabWord.fromSync(String id, Map<String, dynamic> data, int updatedAt, bool deleted) => VocabWord(
        id: id,
        word: (data['word'] ?? '') as String,
        ipa: (data['ipa'] ?? '') as String,
        pos: (data['pos'] ?? '') as String,
        meaningVi: (data['meaning_vi'] ?? '') as String,
        definitionEn: (data['definition_en'] ?? '') as String,
        exampleEn: (data['example_en'] ?? '') as String,
        exampleVi: (data['example_vi'] ?? '') as String,
        collocations: ((data['collocations'] ?? const []) as List).cast<String>(),
        level: (data['level'] ?? 'B2') as String,
        topic: (data['topic'] ?? '') as String,
        updatedAt: updatedAt,
        deleted: deleted,
      );

  Map<String, dynamic> toJson() => {'id': id, 'data': toData(), 'updated_at': updatedAt, 'deleted': deleted};

  factory VocabWord.fromJson(Map<String, dynamic> j) =>
      VocabWord.fromSync(j['id'] as String, (j['data'] as Map).cast<String, dynamic>(), j['updated_at'] as int, j['deleted'] as bool);

  VocabWord markDeleted() => VocabWord.fromSync(id, toData(), DateTime.now().millisecondsSinceEpoch, true);
}

class Me {
  Me.fromJson(Map<String, dynamic> j)
      : email = j['user']['email'] as String,
        name = (j['user']['name'] ?? '') as String,
        emailVerified = j['user']['email_verified'] as bool,
        premium = j['plan'] == 'premium',
        expiresAt = j['expires_at'] as int?,
        quotaRemaining = j['quota']['remaining'] as int,
        quotaLimit = j['quota']['limit'] as int,
        maxWordsPerGen = j['limits']['maxWordsPerGen'] as int,
        levels = (j['limits']['levels'] as List).cast<String>(),
        customTopics = j['limits']['customTopics'] as bool,
        canSync = j['limits']['sync'] as bool;

  /// Local demo account: everything unlocked, no server involved.
  Me.demo()
      : email = 'demo@local',
        name = 'Demo',
        emailVerified = true,
        premium = true,
        expiresAt = null,
        quotaRemaining = 99,
        quotaLimit = 99,
        maxWordsPerGen = 8,
        levels = const ['B2', 'C1'],
        customTopics = true,
        canSync = false;

  final String email, name;
  final bool emailVerified, premium, customTopics, canSync;
  final int? expiresAt;
  final int quotaRemaining, quotaLimit, maxWordsPerGen;
  final List<String> levels;
}
