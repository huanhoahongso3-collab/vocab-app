import { makeId, type VocabWord } from './models';

/** Offline sample words used by the demo build (EXPO_PUBLIC_DEMO=true). No AI, no network. */
export const demoTopics = ['Công nghệ', 'Môi trường', 'Giáo dục', 'Sức khỏe', 'Du lịch', 'Kinh doanh', 'Xã hội', 'Tâm lý'];

type W = [level: string, word: string, ipa: string, pos: string, vi: string, def: string, ex: string, exVi: string, col: string[], topic: string];

const bank: W[] = [
  // A1 - Beginner
  ['A1', 'friendly', '/ˈfrend.li/', 'adjective', 'thân thiện', 'behaving in a kind and pleasant way towards someone', 'The local people are very friendly.', 'Người dân địa phương rất thân thiện.', ['friendly smile', 'friendly atmosphere'], 'Xã hội'],
  ['A1', 'travel', '/ˈtræv.əl/', 'verb', 'du lịch, đi lại', 'to make a journey, usually over a long distance', 'I want to travel around the world.', 'Tôi muốn đi du lịch vòng quanh thế giới.', ['travel by train', 'travel abroad'], 'Du lịch'],
  ['A1', 'healthy', '/ˈhel.θi/', 'adjective', 'khỏe mạnh', 'strong and not sick; good for your health', 'Eating vegetables keeps you healthy.', 'Ăn rau giúp bạn khỏe mạnh.', ['healthy food', 'healthy lifestyle'], 'Sức khỏe'],
  ['A1', 'learn', '/lɜːn/', 'verb', 'học hỏi', 'to get knowledge or skill in a new subject', 'Children learn languages very quickly.', 'Trẻ em học ngôn ngữ rất nhanh.', ['learn English', 'learn by doing'], 'Giáo dục'],

  // A2 - Elementary
  ['A2', 'community', '/kəˈmjuː.nə.ti/', 'noun', 'cộng đồng', 'the people living in one particular area or considered as a unit', 'We live in a supportive community.', 'Chúng tôi sống trong một cộng đồng hỗ trợ nhau.', ['local community', 'online community'], 'Xã hội'],
  ['A2', 'opportunity', '/ˌɒp.əˈtʃuː.nə.ti/', 'noun', 'cơ hội', 'an occasion or situation that makes it possible to do something', 'This job is a great opportunity to learn.', 'Công việc này là một cơ hội tuyệt vời để học hỏi.', ['great opportunity', 'miss an opportunity'], 'Kinh doanh'],
  ['A2', 'protect', '/prəˈtekt/', 'verb', 'bảo vệ', 'to keep someone or something safe from injury, damage, or loss', 'We must protect our forests and oceans.', 'Chúng ta phải bảo vệ rừng và đại dương.', ['protect the environment', 'protect data'], 'Môi trường'],
  ['A2', 'device', '/dɪˈvaɪs/', 'noun', 'thiết bị', 'an object or machine that has been invented for a purpose', 'Keep mobile devices away before bedtime.', 'Hãy để các thiết bị di động ra xa trước giờ đi ngủ.', ['smart device', 'storage device'], 'Công nghệ'],

  // B1 - Intermediate
  ['B1', 'efficient', '/ɪˈfɪʃ.ənt/', 'adjective', 'hiệu quả, năng suất', 'working or operating quickly and effectively in an organized way', 'The new subway system is very efficient.', 'Hệ thống tàu điện ngầm mới rất hiệu quả.', ['highly efficient', 'energy efficient'], 'Công nghệ'],
  ['B1', 'persuade', '/pəˈsweɪd/', 'verb', 'thuyết phục', 'to make someone do or believe something by giving them good reasons', 'She managed to persuade her boss to approve the budget.', 'Cô ấy đã thuyết phục được sếp phê duyệt ngân sách.', ['persuade someone to', 'firmly persuade'], 'Kinh doanh'],
  ['B1', 'preserve', '/prɪˈzɜːv/', 'verb', 'bảo tồn, giữ gìn', 'to keep something as it is, especially in order to prevent it from decaying', 'We should preserve traditional customs.', 'Chúng ta nên gìn giữ các phong tục truyền thống.', ['preserve heritage', 'preserve nature'], 'Du lịch'],
  ['B1', 'attitude', '/ˈæt.ɪ.tʃuːd/', 'noun', 'thái độ', 'a feeling or opinion about something or someone', 'A positive attitude helps overcome challenges.', 'Thái độ tích cực giúp vượt qua các thử thách.', ['positive attitude', 'change one\'s attitude'], 'Tâm lý'],

  // B2 - Upper Intermediate
  ['B2', 'sustainable', '/səˈsteɪnəbl/', 'adjective', 'bền vững', 'able to continue over a long time without harming the environment', 'The city is investing in sustainable transport.', 'Thành phố đang đầu tư vào giao thông bền vững.', ['sustainable development', 'sustainable energy'], 'Môi trường'],
  ['B2', 'outcome', '/ˈaʊtkʌm/', 'noun', 'kết quả', 'the final result of an action or process', 'The outcome of the experiment surprised everyone.', 'Kết quả thí nghiệm khiến mọi người bất ngờ.', ['positive outcome', 'likely outcome'], 'Giáo dục'],
  ['B2', 'implement', '/ˈɪmplɪment/', 'verb', 'triển khai, thực hiện', 'to put a plan or system into action', 'The company will implement the new policy in May.', 'Công ty sẽ triển khai chính sách mới vào tháng 5.', ['implement a plan', 'implement changes'], 'Kinh doanh'],
  ['B2', 'reliable', '/rɪˈlaɪəbl/', 'adjective', 'đáng tin cậy', 'able to be trusted to do something well', 'We need a reliable source of information.', 'Chúng ta cần một nguồn thông tin đáng tin cậy.', ['reliable data', 'highly reliable'], 'Công nghệ'],
  ['B2', 'tackle', '/ˈtækl/', 'verb', 'giải quyết, xử lý', 'to try to deal with a difficult problem', 'Governments must tackle climate change together.', 'Các chính phủ phải cùng nhau giải quyết biến đổi khí hậu.', ['tackle a problem', 'tackle an issue'], 'Môi trường'],
  ['B2', 'awareness', '/əˈweənəs/', 'noun', 'nhận thức', 'knowledge or understanding of a subject or situation', 'The campaign raised awareness of mental health.', 'Chiến dịch nâng cao nhận thức về sức khỏe tinh thần.', ['raise awareness', 'public awareness'], 'Sức khỏe'],
  ['B2', 'enhance', '/ɪnˈhɑːns/', 'verb', 'nâng cao, cải thiện', 'to improve the quality or value of something', 'Good lighting can enhance the mood of a room.', 'Ánh sáng tốt có thể làm tăng không khí của căn phòng.', ['enhance performance', 'greatly enhance'], 'Công nghệ'],
  ['B2', 'potential', '/pəˈtenʃl/', 'noun', 'tiềm năng', 'the possibility of developing into something', 'The start-up has enormous potential for growth.', 'Công ty khởi nghiệp có tiềm năng tăng trưởng rất lớn.', ['full potential', 'potential risk'], 'Kinh doanh'],
  ['B2', 'innovation', '/ˌɪn.əˈveɪ.ʃən/', 'noun', 'sự đổi mới, sáng tạo', 'a new idea, method, or invention', 'Technological innovation drives economic growth.', 'Đổi mới công nghệ thúc đẩy tăng trưởng kinh tế.', ['technological innovation', 'encourage innovation'], 'Công nghệ'],
  ['B2', 'accessible', '/əkˈses.ə.bəl/', 'adjective', 'dễ tiếp cận', 'easy to approach, enter, obtain, or use', 'Online courses make education accessible to all.', 'Các khóa học trực tuyến giúp giáo dục dễ tiếp cận với mọi người.', ['easily accessible', 'freely accessible'], 'Giáo dục'],
  ['B2', 'collaboration', '/kəˌlæb.əˈreɪ.ʃən/', 'noun', 'sự cộng tác', 'the act of working with someone to produce something', 'Teamwork and collaboration are key to success.', 'Làm việc nhóm và sự cộng tác là chìa khóa thành công.', ['close collaboration', 'in collaboration with'], 'Kinh doanh'],
  ['B2', 'resilience', '/rɪˈzɪl.jəns/', 'noun', 'sức bền, khả năng phục hồi', 'the ability to recover quickly from difficulties', 'The team showed remarkable resilience during the crisis.', 'Đội ngũ đã thể hiện sức bền đáng kinh ngạc trong cơn khủng hoảng.', ['mental resilience', 'build resilience'], 'Tâm lý'],

  // C1 - Advanced
  ['C1', 'ubiquitous', '/juːˈbɪkwɪtəs/', 'adjective', 'có mặt ở khắp nơi', 'seeming to be present everywhere at the same time', 'Smartphones have become ubiquitous in modern life.', 'Điện thoại thông minh đã trở nên phổ biến khắp nơi.', ['ubiquitous presence', 'increasingly ubiquitous'], 'Công nghệ'],
  ['C1', 'exacerbate', '/ɪɡˈzæsəbeɪt/', 'verb', 'làm trầm trọng thêm', 'to make a bad situation worse', 'Poor planning exacerbated the traffic problem.', 'Quy hoạch kém đã làm vấn đề giao thông tồi tệ hơn.', ['exacerbate the problem', 'further exacerbate'], 'Môi trường'],
  ['C1', 'scrutiny', '/ˈskruːtəni/', 'noun', 'sự xem xét kỹ lưỡng', 'careful and detailed examination', 'The proposal came under intense scrutiny.', 'Đề xuất bị xem xét hết sức kỹ lưỡng.', ['under scrutiny', 'public scrutiny'], 'Kinh doanh'],
  ['C1', 'mitigate', '/ˈmɪtɪɡeɪt/', 'verb', 'giảm nhẹ', 'to make something less harmful or serious', 'Trees help mitigate the effects of air pollution.', 'Cây xanh giúp giảm nhẹ tác động của ô nhiễm không khí.', ['mitigate risk', 'mitigate the impact'], 'Môi trường'],
  ['C1', 'pragmatic', '/præɡˈmætɪk/', 'adjective', 'thực dụng, thực tế', 'dealing with problems in a practical, sensible way', 'She took a pragmatic approach to the negotiations.', 'Cô ấy tiếp cận đàm phán một cách thực tế.', ['pragmatic approach', 'pragmatic solution'], 'Kinh doanh'],
  ['C1', 'proliferation', '/prəˌlɪfəˈreɪʃn/', 'noun', 'sự gia tăng nhanh', 'a rapid increase in the number of something', 'The proliferation of fake news worries educators.', 'Sự lan tràn tin giả khiến các nhà giáo dục lo ngại.', ['rapid proliferation', 'nuclear proliferation'], 'Xã hội'],
  ['C1', 'disseminate', '/dɪˈsemɪneɪt/', 'verb', 'phổ biến, lan truyền', 'to spread information widely', 'Researchers disseminate their findings through journals.', 'Các nhà nghiên cứu phổ biến kết quả qua tạp chí khoa học.', ['disseminate information', 'widely disseminated'], 'Giáo dục'],
  ['C1', 'inevitable', '/ɪnˈevɪtəbl/', 'adjective', 'không thể tránh khỏi', 'certain to happen and unable to be avoided', 'Some delay was inevitable given the weather.', 'Một sự chậm trễ là không thể tránh khỏi vì thời tiết.', ['inevitable consequence', 'virtually inevitable'], 'Xã hội'],
  ['C1', 'ambiguity', '/ˌæm.bɪˈɡjuː.ə.ti/', 'noun', 'sự mơ hồ, không rõ ràng', 'the state of having more than one possible meaning', 'Avoid ambiguity in contract agreements.', 'Tránh sự mơ hồ trong các thỏa thuận hợp đồng.', ['moral ambiguity', 'resolve ambiguity'], 'Kinh doanh'],
  ['C1', 'paradigm', '/ˈpær.ə.daɪm/', 'noun', 'mô hình, khuôn mẫu', 'a typical example or pattern of something', 'Quantum computing is a new paradigm in technology.', 'Điện toán lượng tử là một mô hình mới trong công nghệ.', ['paradigm shift', 'dominant paradigm'], 'Công nghệ'],
  ['C1', 'cognitive', '/ˈkɒɡ.nə.tɪv/', 'adjective', 'liên quan đến nhận thức', 'connected with thinking or conscious mental processes', 'Reading regularly improves cognitive function.', 'Đọc sách thường xuyên giúp cải thiện chức năng nhận thức.', ['cognitive ability', 'cognitive decline'], 'Tâm lý'],
  ['C1', 'unprecedented', '/ʌnˈpres.ɪ.den.tɪd/', 'adjective', 'chưa từng có tiền lệ', 'never having happened or existed in the past', 'The world faces an unprecedented climate challenge.', 'Thế giới đối mặt với một thách thức khí hậu chưa từng có.', ['unprecedented scale', 'unprecedented growth'], 'Môi trường'],

  // C2 - Proficiency
  ['C2', 'ephemeral', '/ɪˈfem.ər.əl/', 'adjective', 'phù du, chóng tàn', 'lasting for only a very short time', 'Fame in the digital era can be purely ephemeral.', 'Sự nổi tiếng trong kỷ nguyên số có thể rất chóng tàn.', ['ephemeral nature', 'ephemeral pleasure'], 'Nghệ thuật'],
  ['C2', 'ubiquity', '/juːˈbɪk.wɪ.ti/', 'noun', 'sự phổ biến ở khắp nơi', 'the state of being very common or appearing everywhere', 'The ubiquity of social media alters human communication.', 'Sự phổ biến khắp nơi của mạng xã hội làm biến đổi giao tiếp của con người.', ['growing ubiquity', 'cultural ubiquity'], 'Công nghệ'],
  ['C2', 'quandary', '/ˈkwɒn.dri/', 'noun', 'tình thế tiến thoái lưỡng nan', 'a state of not being able to decide what to do about a situation', 'The government found itself in an economic quandary.', 'Chính phủ nhận thấy mình rơi vào tình thế tiến thoái lưỡng nan về kinh tế.', ['in a quandary', 'moral quandary'], 'Kinh doanh'],
  ['C2', 'inexorable', '/ɪnˈek.sər.ə.bəl/', 'adjective', 'không thể lay chuyển, không thể dừng lại', 'continuing without any possibility of being stopped', 'The inexorable rise of artificial intelligence is transforming all fields.', 'Sự trỗi dậy không thể ngăn cản của trí tuệ nhân tạo đang biến đổi mọi ngành nghề.', ['inexorable progress', 'inexorable rise'], 'Công nghệ'],
];

export function demoGenerate(level: string, topic: string, count: number): VocabWord[] {
  const now = Date.now();
  const isMatch = (itemLevel: string) => {
    if (level === 'ALL' || level === 'A1-C2' || level === 'B2+C1') {
      if (level === 'B2+C1') return itemLevel === 'B2' || itemLevel === 'C1';
      return true;
    }
    return itemLevel.toUpperCase() === level.toUpperCase();
  };

  const pool = bank.filter((w) => isMatch(w[0]));
  const finalPool = pool.length > 0 ? pool : bank;

  return [...finalPool]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(([wLevel, word, ipa, pos, vi, def, ex, exVi, col, wTopic]) => ({
      id: makeId(wLevel, word),
      word,
      ipa,
      pos,
      meaningVi: vi,
      definitionEn: def,
      exampleEn: ex,
      exampleVi: exVi,
      collocations: col,
      level: wLevel,
      topic: topic || wTopic,
      updatedAt: now,
      deleted: false,
      mastered: false,
      reviewCount: 0,
    }));
}
