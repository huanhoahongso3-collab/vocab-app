import * as Speech from 'expo-speech';
import React, { useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, HelperText, IconButton, ProgressBar, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import type { VocabWord } from '../models';
import { useSaved } from '../store';
import { BIG } from '../theme';

type ReviseMode = 'flashcard' | 'quiz' | 'typing';

export function ReviewScreen({ onNavigateGenerate }: { onNavigateGenerate: () => void }) {
  const theme = useTheme();
  const { words, docs, reminder, markWordReviewed, t, lang } = useSaved();
  const [mode, setMode] = useState<ReviseMode>('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Flashcard state
  const [flipped, setFlipped] = useState(false);

  // Quiz state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Typing state
  const [typedInput, setTypedInput] = useState('');
  const [typingResult, setTypingResult] = useState<'idle' | 'correct' | 'wrong'>('idle');

  // Filter unmastered words or all saved words
  const reviewQueue = useMemo(() => {
    if (words.length === 0) return [];
    return [...words];
  }, [words]);

  const currentWord: VocabWord | undefined = reviewQueue[currentIndex];

  // Multiple choice distractors for Quiz mode
  const quizOptions = useMemo(() => {
    if (!currentWord || reviewQueue.length === 0) return [];
    const correct = currentWord.meaningVi;
    const others = reviewQueue
      .filter((w) => w.id !== currentWord.id && w.meaningVi !== correct)
      .map((w) => w.meaningVi);

    // Fallback default meanings if not enough saved words
    const fallbackMeanings = ['bền vững', 'kết quả', 'đáng tin cậy', 'sự xem xét kỹ lưỡng', 'tiềm năng', 'đổi mới sáng tạo'];
    const candidates = [...others, ...fallbackMeanings.filter((m) => m !== correct)];
    const shuffledOthers = candidates.sort(() => Math.random() - 0.5).slice(0, 3);
    return [correct, ...shuffledOthers].sort(() => Math.random() - 0.5);
  }, [currentWord, reviewQueue]);

  const handleNextWord = () => {
    setFlipped(false);
    setSelectedOption(null);
    setTypedInput('');
    setTypingResult('idle');
    if (currentIndex < reviewQueue.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRate = async (remembered: boolean) => {
    if (!currentWord) return;
    await markWordReviewed(currentWord.id, remembered);
    handleNextWord();
  };

  const handleSelectQuizOption = async (option: string) => {
    if (selectedOption !== null || !currentWord) return;
    setSelectedOption(option);
    const isCorrect = option === currentWord.meaningVi;
    if (isCorrect) setQuizScore((s) => s + 1);
    await markWordReviewed(currentWord.id, isCorrect);
  };

  const handleCheckTyping = async () => {
    if (!currentWord || !typedInput.trim()) return;
    const isCorrect = typedInput.trim().toLowerCase() === currentWord.word.trim().toLowerCase();
    setTypingResult(isCorrect ? 'correct' : 'wrong');
    await markWordReviewed(currentWord.id, isCorrect);
  };

  const handleSpeak = (text: string) => {
    Speech.speak(text, { language: 'en-US', rate: 0.95 });
  };

  if (words.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconButton icon="cards-outline" size={64} iconColor={theme.colors.primary} />
        <Text variant="headlineSmall" style={styles.emptyTitle}>{t('noWordsToRevise')}</Text>
        <Text style={{ textAlign: 'center', color: theme.colors.outline, marginTop: 8, paddingHorizontal: 32 }}>
          {t('noWordsPrompt')}
        </Text>
        <Button mode="contained" icon="sparkles" onPress={onNavigateGenerate} style={{ marginTop: 24, borderRadius: 999 }}>
          {t('goToGen')}
        </Button>
      </View>
    );
  }

  const progressPercent = Math.min(1, reminder.reviewedToday / (reminder.dailyGoal || 1));

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Reminder Banner */}
      <Card style={[styles.reminderCard, { backgroundColor: theme.colors.primaryContainer }]}>
        <Card.Content>
          <View style={styles.reminderRow}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ fontWeight: '800', color: theme.colors.onPrimaryContainer }}>
                {t('reminderBannerTitle', { streak: reminder.streakDays })}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.85, marginTop: 2 }}>
                {t('reminderBannerSub', { time: reminder.time, status: reminder.enabled ? t('active') : t('inactive') })}
              </Text>
            </View>
            <IconButton icon="bell-ring" size={24} iconColor={theme.colors.onPrimaryContainer} />
          </View>

          {/* Daily Progress */}
          <View style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                {t('todayProgress', { count: reminder.reviewedToday, goal: reminder.dailyGoal })}
              </Text>
              <Text variant="labelSmall" style={{ fontWeight: '700', color: theme.colors.onPrimaryContainer }}>
                {Math.round(progressPercent * 100)}%
              </Text>
            </View>
            <ProgressBar progress={progressPercent} color={theme.colors.primary} style={{ height: 6, borderRadius: 3 }} />
          </View>
        </Card.Content>
      </Card>

      {/* Mode Switcher */}
      <SegmentedButtons
        value={mode}
        onValueChange={(v) => {
          setMode(v as ReviseMode);
          setFlipped(false);
          setSelectedOption(null);
          setTypedInput('');
          setTypingResult('idle');
          setQuizFinished(false);
        }}
        buttons={[
          { value: 'flashcard', label: t('modeFlashcard'), icon: 'cards' },
          { value: 'quiz', label: t('modeQuiz'), icon: 'help-circle-outline' },
          { value: 'typing', label: t('modeTyping'), icon: 'keyboard-outline' },
        ]}
        style={styles.modeButtons}
      />

      {/* Completed State */}
      {quizFinished ? (
        <Card style={styles.cardFinished}>
          <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
            <IconButton icon="trophy-award" size={56} iconColor="#F57C00" />
            <Text variant="headlineSmall" style={{ fontWeight: '800', textAlign: 'center', marginTop: 8 }}>
              {t('allMastered')}
            </Text>
            {mode === 'quiz' && (
              <Text variant="titleMedium" style={{ marginTop: 8, color: theme.colors.primary, fontWeight: '700' }}>
                {t('quizScore', { score: quizScore, total: reviewQueue.length })}
              </Text>
            )}
            <Button
              mode="contained"
              icon="refresh"
              onPress={() => {
                setCurrentIndex(0);
                setQuizScore(0);
                setQuizFinished(false);
                setFlipped(false);
              }}
              style={{ marginTop: 20, borderRadius: 999 }}
            >
              {t('btnReviseAll', { count: reviewQueue.length })}
            </Button>
          </Card.Content>
        </Card>
      ) : currentWord ? (
        <>
          {/* Progress Indicator */}
          <Text variant="labelMedium" style={{ textAlign: 'center', color: theme.colors.outline, marginBottom: 12 }}>
            Từ {currentIndex + 1} / {reviewQueue.length}
          </Text>

          {/* MODE 1: FLASHCARD */}
          {mode === 'flashcard' && (
            <View>
              <Pressable
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
                  setFlipped(!flipped);
                  if (!flipped && reminder.autoSpeak) {
                    handleSpeak(currentWord.word);
                  }
                }}
                style={[styles.flashcard, { backgroundColor: flipped ? theme.colors.surfaceVariant : theme.colors.elevation.level3 }]}
              >
                {/* Level badge */}
                <View style={styles.cardTopBadge}>
                  <Chip compact style={{ backgroundColor: currentWord.level === 'C1' ? '#EDE7F6' : '#E0F2F1' }}>
                    {currentWord.level}
                  </Chip>
                  {!!currentWord.pos && (
                    <Chip compact style={{ marginLeft: 6 }}>{currentWord.pos}</Chip>
                  )}
                  <IconButton
                    icon="volume-high"
                    size={22}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSpeak(currentWord.word);
                    }}
                    style={{ marginLeft: 'auto' }}
                  />
                </View>

                {/* Content */}
                <View style={styles.cardBody}>
                  <Text variant="headlineLarge" style={styles.flashWord}>{currentWord.word}</Text>
                  {!!currentWord.ipa && (
                    <Text variant="titleMedium" style={{ color: theme.colors.primary, fontStyle: 'italic', marginTop: 4 }}>
                      {currentWord.ipa}
                    </Text>
                  )}

                  {flipped ? (
                    <View style={styles.flippedContent}>
                      <Text variant="headlineSmall" style={styles.meaningText}>{currentWord.meaningVi}</Text>
                      {!!currentWord.definitionEn && (
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6, fontStyle: 'italic', textAlign: 'center' }}>
                          {currentWord.definitionEn}
                        </Text>
                      )}
                      {!!currentWord.exampleEn && (
                          <View style={[styles.exampleBox, { backgroundColor: theme.colors.elevation.level2 }]}>
                          <Text variant="bodyMedium" style={{ fontWeight: '600' }}>“{currentWord.exampleEn}”</Text>
                          {!!currentWord.exampleVi && (
                            <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 4 }}>{currentWord.exampleVi}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: 24 }}>
                      {t('tapToFlip')}
                    </Text>
                  )}
                </View>
              </Pressable>

              {/* Action Buttons */}
              <View style={styles.ratingRow}>
                <Button
                  mode="outlined"
                  icon="close"
                  onPress={() => handleRate(false)}
                  style={[styles.rateBtn, { borderColor: '#E53935' }]}
                  textColor="#E53935"
                >
                  {t('btnNeedPractice')}
                </Button>
                <Button
                  mode="contained"
                  icon="check"
                  onPress={() => handleRate(true)}
                  style={[styles.rateBtn, { backgroundColor: '#2E7D32' }]}
                >
                  {t('btnRemembered')}
                </Button>
              </View>
            </View>
          )}

          {/* MODE 2: QUIZZES */}
          {mode === 'quiz' && (
            <Card style={styles.quizCard}>
              <Card.Content>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text variant="headlineSmall" style={{ fontWeight: '800' }}>{currentWord.word}</Text>
                  <IconButton icon="volume-high" onPress={() => handleSpeak(currentWord.word)} />
                </View>
                {!!currentWord.ipa && (
                  <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontStyle: 'italic', marginBottom: 16 }}>
                    {currentWord.ipa} ({currentWord.pos})
                  </Text>
                )}

                <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 12 }}>
                  {t('quizQuestion')}
                </Text>

                {quizOptions.map((opt, i) => {
                  let btnColor = theme.colors.surfaceVariant;
                  let textColor = theme.colors.onSurface;
                  if (selectedOption !== null) {
                    if (opt === currentWord.meaningVi) {
                      btnColor = '#C8E6C9';
                      textColor = '#1B5E20';
                    } else if (selectedOption === opt) {
                      btnColor = '#FFCDD2';
                      textColor = '#B71C1C';
                    }
                  }

                  return (
                    <Pressable
                      key={i}
                      onPress={() => handleSelectQuizOption(opt)}
                      style={[styles.quizOption, { backgroundColor: btnColor }]}
                    >
                      <Text variant="bodyLarge" style={{ color: textColor, fontWeight: '600' }}>
                        {String.fromCharCode(65 + i)}. {opt}
                      </Text>
                    </Pressable>
                  );
                })}

                {selectedOption !== null && (
                  <Button
                    mode="contained"
                    icon="arrow-right"
                    onPress={handleNextWord}
                    style={{ marginTop: 16, borderRadius: 999 }}
                  >
                    {t('nextQuestion')}
                  </Button>
                )}
              </Card.Content>
            </Card>
          )}

          {/* MODE 3: TYPING TEST */}
          {mode === 'typing' && (
            <Card style={styles.typingCard}>
              <Card.Content>
                <Text variant="labelMedium" style={{ color: theme.colors.outline }}>{t('typingPrompt')}</Text>
                <Text variant="headlineSmall" style={{ fontWeight: '800', marginTop: 6, color: theme.colors.primary }}>
                  {currentWord.meaningVi}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                  Loại từ: {currentWord.pos} • Cấp độ: {currentWord.level}
                </Text>

                {/* Example sentence with masked blank */}
                {!!currentWord.exampleEn && (
                  <View style={[styles.exampleBox, { backgroundColor: theme.colors.elevation.level2, marginTop: 14 }]}>
                    <Text variant="bodyMedium">
                      “{currentWord.exampleEn.replace(new RegExp(currentWord.word, 'gi'), '_____')}”
                    </Text>
                  </View>
                )}

                <Text variant="labelSmall" style={{ marginTop: 12, color: theme.colors.primary, fontWeight: '600' }}>
                  {t('hintFirstLetter', { letter: currentWord.word[0].toUpperCase() })}
                </Text>

                <TextInput
                  mode="outlined"
                  placeholder={t('typePlaceholder')}
                  value={typedInput}
                  onChangeText={(val) => {
                    setTypedInput(val);
                    if (typingResult !== 'idle') setTypingResult('idle');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={handleCheckTyping}
                  outlineStyle={{ borderRadius: BIG }}
                  style={{ marginTop: 8 }}
                />

                {typingResult === 'correct' && (
                  <HelperText type="info" visible style={{ color: '#2E7D32', fontWeight: '700' }}>
                    {t('correctMsg')}
                  </HelperText>
                )}

                {typingResult === 'wrong' && (
                  <HelperText type="error" visible style={{ fontWeight: '700' }}>
                    {t('incorrectMsg', { answer: currentWord.word })}
                  </HelperText>
                )}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <Button
                    mode="contained"
                    onPress={typingResult === 'idle' ? handleCheckTyping : handleNextWord}
                    style={{ flex: 1, borderRadius: 999 }}
                  >
                    {typingResult === 'idle' ? t('btnCheck') : t('nextQuestion')}
                  </Button>
                  <IconButton
                    icon="volume-high"
                    mode="contained-tonal"
                    onPress={() => handleSpeak(currentWord.word)}
                    style={{ borderRadius: 999 }}
                  />
                </View>
              </Card.Content>
            </Card>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 60,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontWeight: '800',
    marginTop: 8,
  },
  reminderCard: {
    borderRadius: 20,
    marginBottom: 16,
    elevation: 2,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeButtons: {
    marginBottom: 16,
  },
  flashcard: {
    minHeight: 280,
    borderRadius: BIG,
    padding: 20,
    justifyContent: 'space-between',
    elevation: 2,
  },
  cardTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBody: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  flashWord: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  flippedContent: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  meaningText: {
    fontWeight: '700',
    color: '#00796B',
    textAlign: 'center',
  },
  exampleBox: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    width: '100%',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  rateBtn: {
    flex: 1,
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
  },
  quizCard: {
    borderRadius: BIG,
    padding: 8,
    elevation: 2,
  },
  quizOption: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  typingCard: {
    borderRadius: BIG,
    padding: 8,
    elevation: 2,
  },
  cardFinished: {
    borderRadius: BIG,
    marginTop: 16,
  },
});
