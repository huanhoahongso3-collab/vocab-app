import { makeId, type VocabWord } from './models';

/** Offline sample words used by the demo build (EXPO_PUBLIC_DEMO=true). No AI, no network. */
export const demoTopics = ['Công nghệ', 'Môi trường', 'Giáo dục', 'Sức khỏe', 'Du lịch', 'Kinh doanh'];

type W = [level: string, word: string, ipa: string, pos: string, vi: string, def: string, ex: string, exVi: string, col: string[]];

const bank: W[] = [
  ['B2', 'sustainable', '/səˈsteɪnəbl/', 'adjective', 'bền vững', 'able to continue over a long time without harming the environment', 'The city is investing in sustainable transport.', 'Thành phố đang đầu tư vào giao thông bền vững.', ['sustainable development', 'sustainable energy']],
  ['B2', 'outcome', '/ˈaʊtkʌm/', 'noun', 'kết quả', 'the final result of an action or process', 'The outcome of the experiment surprised everyone.', 'Kết quả thí nghiệm khiến mọi người bất ngờ.', ['positive outcome', 'likely outcome']],
  ['B2', 'implement', '/ˈɪmplɪment/', 'verb', 'triển khai, thực hiện', 'to put a plan or system into action', 'The company will implement the new policy in May.', 'Công ty sẽ triển khai chính sách mới vào tháng 5.', ['implement a plan', 'implement changes']],
  ['B2', 'reliable', '/rɪˈlaɪəbl/', 'adjective', 'đáng tin cậy', 'able to be trusted to do something well', 'We need a reliable source of information.', 'Chúng ta cần một nguồn thông tin đáng tin cậy.', ['reliable data', 'highly reliable']],
  ['B2', 'tackle', '/ˈtækl/', 'verb', 'giải quyết, xử lý', 'to try to deal with a difficult problem', 'Governments must tackle climate change together.', 'Các chính phủ phải cùng nhau giải quyết biến đổi khí hậu.', ['tackle a problem', 'tackle an issue']],
  ['B2', 'awareness', '/əˈweənəs/', 'noun', 'nhận thức', 'knowledge or understanding of a subject or situation', 'The campaign raised awareness of mental health.', 'Chiến dịch nâng cao nhận thức về sức khỏe tinh thần.', ['raise awareness', 'public awareness']],
  ['B2', 'enhance', '/ɪnˈhɑːns/', 'verb', 'nâng cao, cải thiện', 'to improve the quality or value of something', 'Good lighting can enhance the mood of a room.', 'Ánh sáng tốt có thể làm tăng không khí của căn phòng.', ['enhance performance', 'greatly enhance']],
  ['B2', 'potential', '/pəˈtenʃl/', 'noun', 'tiềm năng', 'the possibility of developing into something', 'The start-up has enormous potential for growth.', 'Công ty khởi nghiệp có tiềm năng tăng trưởng rất lớn.', ['full potential', 'potential risk']],
  ['C1', 'ubiquitous', '/juːˈbɪkwɪtəs/', 'adjective', 'có mặt ở khắp nơi', 'seeming to be present everywhere at the same time', 'Smartphones have become ubiquitous in modern life.', 'Điện thoại thông minh đã trở nên phổ biến khắp nơi.', ['ubiquitous presence', 'increasingly ubiquitous']],
  ['C1', 'exacerbate', '/ɪɡˈzæsəbeɪt/', 'verb', 'làm trầm trọng thêm', 'to make a bad situation worse', 'Poor planning exacerbated the traffic problem.', 'Quy hoạch kém đã làm vấn đề giao thông tồi tệ hơn.', ['exacerbate the problem', 'further exacerbate']],
  ['C1', 'scrutiny', '/ˈskruːtəni/', 'noun', 'sự xem xét kỹ lưỡng', 'careful and detailed examination', 'The proposal came under intense scrutiny.', 'Đề xuất bị xem xét hết sức kỹ lưỡng.', ['under scrutiny', 'public scrutiny']],
  ['C1', 'mitigate', '/ˈmɪtɪɡeɪt/', 'verb', 'giảm nhẹ', 'to make something less harmful or serious', 'Trees help mitigate the effects of air pollution.', 'Cây xanh giúp giảm nhẹ tác động của ô nhiễm không khí.', ['mitigate risk', 'mitigate the impact']],
  ['C1', 'pragmatic', '/præɡˈmætɪk/', 'adjective', 'thực dụng, thực tế', 'dealing with problems in a practical, sensible way', 'She took a pragmatic approach to the negotiations.', 'Cô ấy tiếp cận đàm phán một cách thực tế.', ['pragmatic approach', 'pragmatic solution']],
  ['C1', 'proliferation', '/prəˌlɪfəˈreɪʃn/', 'noun', 'sự gia tăng nhanh', 'a rapid increase in the number of something', 'The proliferation of fake news worries educators.', 'Sự lan tràn tin giả khiến các nhà giáo dục lo ngại.', ['rapid proliferation', 'nuclear proliferation']],
  ['C1', 'disseminate', '/dɪˈsemɪneɪt/', 'verb', 'phổ biến, lan truyền', 'to spread information widely', 'Researchers disseminate their findings through journals.', 'Các nhà nghiên cứu phổ biến kết quả qua tạp chí khoa học.', ['disseminate information', 'widely disseminated']],
  ['C1', 'inevitable', '/ɪnˈevɪtəbl/', 'adjective', 'không thể tránh khỏi', 'certain to happen and unable to be avoided', 'Some delay was inevitable given the weather.', 'Một sự chậm trễ là không thể tránh khỏi vì thời tiết.', ['inevitable consequence', 'virtually inevitable']],
];

export function demoGenerate(level: string, topic: string, count: number): VocabWord[] {
  const now = Date.now();
  return bank
    .filter((w) => w[0] === level)
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(([, word, ipa, pos, vi, def, ex, exVi, col]) => ({
      id: makeId(level, word), word, ipa, pos, meaningVi: vi, definitionEn: def, exampleEn: ex, exampleVi: exVi,
      collocations: col, level, topic, updatedAt: now, deleted: false,
    }));
}
