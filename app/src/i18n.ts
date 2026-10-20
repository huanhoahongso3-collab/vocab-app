export type Lang = 'vi' | 'en';

export const translations = {
  vi: {
    // Navigation
    tabGen: 'Tạo từ',
    tabRevise: 'Ôn tập',
    tabSaved: 'Bộ từ',
    tabAccount: 'Cài đặt',

    // Generate Screen
    heroTitle: 'Học từ vựng',
    heroSubtitle: 'Cấp độ A1 đến C2 cùng AI',
    levelLabel: 'Cấp độ CEFR',
    allLevels: 'Tất cả (A1 - C2)',
    topicLabel: 'Chủ đề',
    customTopicPlaceholder: 'Nhập chủ đề bất kỳ (vd: AI, Phỏng vấn...)',
    wordCountLabel: 'Số lượng từ',
    targetDocLabel: 'Lưu vào tài liệu',
    btnGenerate: 'Tạo từ vựng',
    btnGenerating: 'AI đang tạo từ...',
    remainingQuota: 'Còn {remaining}/{limit} lượt hôm nay',
    topicRequired: 'Hãy chọn hoặc nhập một chủ đề.',
    generationSuccess: 'Đã tạo thành công {count} từ mới!',

    // Word Card
    pronounce: 'Phát âm',
    saveWord: 'Lưu từ',
    savedWord: 'Đã lưu',
    collocations: 'Cụm từ đi kèm (Collocations)',
    mastered: 'Đã thuộc ⭐',
    assignDoc: 'Gán tài liệu',
    untitledDoc: 'Untitled Document',

    // Revise Screen
    reviseTitle: 'Ôn tập từ vựng',
    modeFlashcard: 'Thẻ nhớ',
    modeQuiz: 'Trắc nghiệm',
    modeTyping: 'Gõ từ',
    reminderBannerTitle: 'Chuỗi học: {streak} ngày liên tiếp 🔥',
    reminderBannerSub: 'Nhắc nhở lúc {time} hằng ngày ({status})',
    active: 'Bật',
    inactive: 'Tắt',
    todayProgress: 'Tiến độ hôm nay: {count}/{goal} từ',
    noWordsToRevise: 'Chưa có từ nào để ôn tập',
    noWordsPrompt: 'Hãy tạo hoặc lưu thêm từ vựng để bắt đầu ôn nhé!',
    goToGen: 'Đến trang Tạo từ',
    allMastered: 'Chúc mừng! Bạn đã hoàn thành các từ hôm nay 🎉',
    btnReviseAll: 'Ôn lại tất cả {count} từ',

    // Flashcard
    tapToFlip: 'Chạm để lật thẻ và xem nghĩa',
    btnNeedPractice: 'Chưa nhớ ❌',
    btnRemembered: 'Đã nhớ ✔️',

    // Quiz
    quizQuestion: 'Chọn nghĩa đúng của từ:',
    quizScore: 'Điểm số: {score}/{total}',
    nextQuestion: 'Câu tiếp theo',
    finishQuiz: 'Hoàn thành bài kiểm tra',

    // Typing
    typingPrompt: 'Nhập từ tiếng Anh tương ứng:',
    typePlaceholder: 'Nhập từ...',
    hintFirstLetter: 'Gợi ý: bắt đầu bằng "{letter}"',
    btnCheck: 'Kiểm tra',
    correctMsg: 'Chính xác! Giỏi lắm 🎉',
    incorrectMsg: 'Chưa đúng. Đáp án là: {answer}',

    // Saved Screen
    savedTitle: 'Tài liệu & Bộ từ',
    searchPlaceholder: 'Tìm từ tiếng Anh, tiếng Việt, chủ đề...',
    allDocs: 'Tất cả',
    newDocBtn: '+ Tài liệu mới',
    newWordBtn: 'Thêm từ',
    createDocTitle: 'Tạo tài liệu mới',
    docNamePlaceholder: 'Tên tài liệu (vd: Untitled Document)',
    docDescPlaceholder: 'Mô tả ngắn...',
    emptySavedTitle: 'Chưa có từ nào trong danh mục này',
    emptySavedDesc: 'Bấm nút "Thêm từ" hoặc tạo từ với AI.',

    // Manual add word modal
    addWordTitle: 'Thêm từ mới',
    wordLabel: 'Từ vựng (English)',
    meaningLabel: 'Nghĩa (Tiếng Việt)',
    posLabel: 'Loại từ (pos)',
    ipaLabel: 'Phiên âm IPA',
    exampleEnLabel: 'Ví dụ (English)',
    exampleViLabel: 'Dịch ví dụ',
    btnSaveWord: 'Lưu từ mới',

    // Account & Settings
    settingsTitle: 'Cài đặt & Nhắc nhở',
    profileTitle: 'Hồ sơ người dùng',
    demoBadge: 'Bản Demo Ngoại Tuyến (Offline)',
    langSection: 'Ngôn ngữ ứng dụng (Language)',
    langVi: 'Tiếng Việt',
    langEn: 'English',
    reminderSection: 'Nhắc nhở ôn tập hằng ngày',
    reminderToggle: 'Bật thông báo nhắc nhở',
    reminderTimeLabel: 'Giờ nhắc nhở',
    reminderMessageLabel: 'Nội dung nhắc nhở',
    dailyGoalLabel: 'Mục tiêu học mỗi ngày (từ)',
    streakLabel: 'Chuỗi học liên tiếp (ngày)',
    autoSpeakToggle: 'Tự động phát âm khi lật thẻ',
    statsSection: 'Thống kê từ vựng',
    totalSaved: 'Tổng số từ đã lưu',
    totalMastered: 'Từ đã thành thạo',
    totalDocs: 'Số tài liệu',
    btnResetData: 'Xóa toàn bộ dữ liệu mẫu',
    btnSaveSettings: 'Đã lưu cài đặt!',
  },
  en: {
    // Navigation
    tabGen: 'Generate',
    tabRevise: 'Revise',
    tabSaved: 'Saved',
    tabAccount: 'Settings',

    // Generate Screen
    heroTitle: 'Learn Vocabulary',
    heroSubtitle: 'CEFR A1 to C2 with AI',
    levelLabel: 'CEFR Level',
    allLevels: 'All Levels (A1 - C2)',
    topicLabel: 'Topic',
    customTopicPlaceholder: 'Enter any topic (e.g. AI, Job Interview...)',
    wordCountLabel: 'Number of words',
    targetDocLabel: 'Save to Document',
    btnGenerate: 'Generate Words',
    btnGenerating: 'Generating with AI...',
    remainingQuota: '{remaining}/{limit} quota left today',
    topicRequired: 'Please choose or enter a topic.',
    generationSuccess: 'Successfully generated {count} words!',

    // Word Card
    pronounce: 'Pronounce',
    saveWord: 'Save word',
    savedWord: 'Saved',
    collocations: 'Collocations',
    mastered: 'Mastered ⭐',
    assignDoc: 'Assign document',
    untitledDoc: 'Untitled Document',

    // Revise Screen
    reviseTitle: 'Revise Vocabulary',
    modeFlashcard: 'Flashcard',
    modeQuiz: 'Quizzes',
    modeTyping: 'Typing Test',
    reminderBannerTitle: 'Study Streak: {streak} days 🔥',
    reminderBannerSub: 'Daily reminder at {time} ({status})',
    active: 'Active',
    inactive: 'Off',
    todayProgress: 'Today: {count}/{goal} words reviewed',
    noWordsToRevise: 'No words to revise yet',
    noWordsPrompt: 'Generate or bookmark words to start revising!',
    goToGen: 'Go to Generator',
    allMastered: 'Awesome! You finished today’s target 🎉',
    btnReviseAll: 'Revise all {count} words',

    // Flashcard
    tapToFlip: 'Tap card to flip and view details',
    btnNeedPractice: 'Need Practice ❌',
    btnRemembered: 'Remembered ✔️',

    // Quiz
    quizQuestion: 'Select the correct meaning for:',
    quizScore: 'Score: {score}/{total}',
    nextQuestion: 'Next question',
    finishQuiz: 'Finish Quiz',

    // Typing
    typingPrompt: 'Type the English word for:',
    typePlaceholder: 'Type word here...',
    hintFirstLetter: 'Hint: starts with "{letter}"',
    btnCheck: 'Check Answer',
    correctMsg: 'Correct! Well done 🎉',
    incorrectMsg: 'Incorrect. The answer is: {answer}',

    // Saved Screen
    savedTitle: 'Documents & Saved Words',
    searchPlaceholder: 'Search English, Vietnamese, topic...',
    allDocs: 'All',
    newDocBtn: '+ New Document',
    newWordBtn: 'Add Word',
    createDocTitle: 'Create New Document',
    docNamePlaceholder: 'Document title (e.g. Untitled Document)',
    docDescPlaceholder: 'Short description...',
    emptySavedTitle: 'No words in this category',
    emptySavedDesc: 'Tap "Add Word" or generate words with AI.',

    // Manual add word modal
    addWordTitle: 'Add Custom Word',
    wordLabel: 'Word (English)',
    meaningLabel: 'Meaning (Vietnamese/Translation)',
    posLabel: 'Part of speech (noun, verb...)',
    ipaLabel: 'Phonetic IPA',
    exampleEnLabel: 'Example sentence (English)',
    exampleViLabel: 'Example translation',
    btnSaveWord: 'Save Word',

    // Account & Settings
    settingsTitle: 'Settings & Reminders',
    profileTitle: 'User Profile',
    demoBadge: 'Offline Demo Build',
    langSection: 'App Language',
    langVi: 'Tiếng Việt',
    langEn: 'English',
    reminderSection: 'Daily Study Reminders',
    reminderToggle: 'Enable Daily Reminders',
    reminderTimeLabel: 'Reminder Time',
    reminderMessageLabel: 'Reminder Message',
    dailyGoalLabel: 'Daily Target (words)',
    streakLabel: 'Study Streak (days)',
    autoSpeakToggle: 'Auto pronounce audio on flip',
    statsSection: 'Vocabulary Statistics',
    totalSaved: 'Total Saved Words',
    totalMastered: 'Mastered Words',
    totalDocs: 'Total Documents',
    btnResetData: 'Reset Demo Data',
    btnSaveSettings: 'Settings saved!',
  },
};
