// Seed data and helpers for 새이파리 육묘장

window.BIZ = {
  name: '새이파리',
  owner: '윤준수',
  bizNo: '364-98-01268',
  address: '전주시 덕진구 화전동 692-15',
  phone: '010-3433-3282',
  fax: '0504-204-5632',
  bank: '농협 352-1981-0292-63',
};

// Korean initial extraction (한글 초성)
const HANGUL_INITIALS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
window.getInitials = (str) => {
  let out = '';
  for (const ch of (str || '')) {
    const code = ch.charCodeAt(0);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      out += HANGUL_INITIALS[Math.floor((code - 0xAC00) / 588)];
    } else if (HANGUL_INITIALS.includes(ch)) {
      out += ch;
    } else {
      out += ch;
    }
  }
  return out;
};

window.fmt = (n) => (Number(n) || 0).toLocaleString('ko-KR');

window.todayLabel = () => {
  const d = new Date();
  const days = ['일','월','화','수','목','금','토'];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return { y, m: d.getMonth()+1, d: d.getDate(), label: `${y}.${m}.${day} (${days[d.getDay()]})` };
};

window.todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
};

window.computeShipDate = (sowDateStr, growingDays) => {
  const [y, m, d] = sowDateStr.split('.').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + Number(growingDays || 0));
  return `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,'0')}.${String(dt.getDate()).padStart(2,'0')}`;
};

window.dateDiff = (aStr, bStr) => {
  // returns days from aStr -> bStr (positive if bStr later)
  const [ay, am, ad] = aStr.split('.').map(Number);
  const [by, bm, bd] = bStr.split('.').map(Number);
  const a = new Date(ay, am - 1, ad).getTime();
  const b = new Date(by, bm - 1, bd).getTime();
  return Math.round((b - a) / 86400000);
};

window.daysBetween = (str) => window.dateDiff(window.todayKey(), str);

// 빈 데이터로 시작 — 첫 실행 시 사용 (샘플 데이터 없음)
window.seedFactory = () => ({
  customers: [],
  items: [],
  recentItems: [],
  favoriteItems: [],
  sowings: [],
  transactions: [],
  payments: [],
  stockMovements: [],
  templates: [],
  nextTransactionId: 1,
  nextCustomerId: 1,
  nextItemId: 1,
  nextSowingId: 1,
  monthlyTotal: 0,
  monthlyPaid: 0,
  monthlyDue: 0,
  dailyRevenue: [],
  trayPresets: [32, 40, 50, 72, 98, 105, 128, 162, 200, 288],
});

window.DEFAULT_TRAY_PRESETS = [32, 40, 50, 72, 98, 105, 128, 162, 200, 288];
// 기존 데이터(추천 목록 필드 없음) 대비 안전 접근자
window.getTrayPresets = () => {
  const s = window.Store?.state;
  if (s && !Array.isArray(s.trayPresets)) s.trayPresets = window.DEFAULT_TRAY_PRESETS.slice();
  return s ? s.trayPresets : window.DEFAULT_TRAY_PRESETS.slice();
};


// Convenience accessors against Store.state
window.findItem = (id) => (window.Store?.state?.items || []).find(i => i.id === id);
window.findCustomer = (id) => (window.Store?.state?.customers || []).find(c => c.id === id);

window.tierLabel = (tier) => tier === 'wholesale' ? '도매가' : tier === 'regular' ? '단골가' : '일반가';
window.tierMultiplier = (tier) => tier === 'wholesale' ? 0.85 : tier === 'regular' ? 0.93 : 1;
window.priceFor = (item, customer) => {
  if (!item) return 0;
  return Math.round(item.price * window.tierMultiplier(customer?.tier || 'standard'));
};
