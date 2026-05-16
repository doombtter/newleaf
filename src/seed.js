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

// Seed factory — used on first run
window.seedFactory = () => ({
  customers: [
    { id: 1, name: '김농부 (덕진농원)', owner: '김상호', phone: '010-2233-1144', address: '전주시 덕진구 송천동 11', type: 'individual', tier: 'regular', due: 320000, last: '2026.05.04', memo: '단골, 매주 화요일 방문' },
    { id: 2, name: '한빛농협 자재센터', owner: '이수영', phone: '063-241-7700', address: '전주시 완산구 평화동 220', type: 'wholesale', tier: 'wholesale', due: 1840000, last: '2026.05.05', memo: '월 마감 정산' },
    { id: 3, name: '정원예 (광활농장)', owner: '정원예', phone: '010-7821-3399', address: '김제시 광활면 중심리 88', type: 'individual', tier: 'standard', due: 0, last: '2026.04.28', memo: '' },
    { id: 4, name: '박재성', owner: '박재성', phone: '010-9912-4477', address: '익산시 함열읍 와리 12-3', type: 'individual', tier: 'regular', due: 180000, last: '2026.05.01', memo: '오이 모종 단골' },
    { id: 5, name: '새벽농산', owner: '최유진', phone: '063-855-2241', address: '완주군 봉동읍 구암리 33', type: 'wholesale', tier: 'wholesale', due: 0, last: '2026.05.06', memo: '' },
    { id: 6, name: '조한석', owner: '조한석', phone: '010-3344-5566', address: '전주시 덕진구 화전동 700', type: 'individual', tier: 'regular', due: 95000, last: '2026.04.30', memo: '바로 옆 농가' },
    { id: 7, name: '유나물상회', owner: '유나정', phone: '063-277-8821', address: '전주시 완산구 효자동 412', type: 'wholesale', tier: 'wholesale', due: 0, last: '2026.05.02', memo: '' },
    { id: 8, name: '이순례', owner: '이순례', phone: '010-5577-8899', address: '김제시 죽산면 서포리 9', type: 'individual', tier: 'standard', due: 55000, last: '2026.04.25', memo: '' },
  ],
  items: [
    { id: 1, name: '청양고추', initials: 'ㅊㅇㄱㅊ', variety: '녹광', tray: 50, spec: '50구', unit: 'tray', price: 15000, stock: 48, safety: 20, growing: 55, useCount: 312, memo: '' },
    { id: 2, name: '청양고추', initials: 'ㅊㅇㄱㅊ', variety: '녹광', tray: 105, spec: '105구', unit: 'tray', price: 18000, stock: 26, safety: 15, growing: 55, useCount: 158, memo: '' },
    { id: 3, name: '순한조생복합', initials: 'ㅅㅎㅈㅅㅂㅎ', variety: '', tray: 50, spec: '50구', unit: 'tray', price: 15000, stock: 84, safety: 30, growing: 55, useCount: 245, memo: '' },
    { id: 4, name: '토마토', initials: 'ㅌㅁㅌ', variety: '찰찰이', tray: 50, spec: '50구', unit: 'tray', price: 16000, stock: 3, safety: 20, growing: 40, useCount: 198, memo: '안전재고 미달' },
    { id: 5, name: '토마토', initials: 'ㅌㅁㅌ', variety: '대저', tray: 72, spec: '72구', unit: 'tray', price: 19000, stock: 22, safety: 15, growing: 40, useCount: 142, memo: '' },
    { id: 6, name: '오이', initials: 'ㅇㅇ', variety: '백다다기', tray: 50, spec: '50구', unit: 'tray', price: 14000, stock: 35, safety: 20, growing: 28, useCount: 174, memo: '' },
    { id: 7, name: '가지', initials: 'ㄱㅈ', variety: '천년', tray: 72, spec: '72구', unit: 'tray', price: 17000, stock: 18, safety: 12, growing: 55, useCount: 88, memo: '' },
    { id: 8, name: '수박', initials: 'ㅅㅂ', variety: '꿀수박', tray: 50, spec: '50구', unit: 'tray', price: 22000, stock: 14, safety: 10, growing: 32, useCount: 67, memo: '접목묘' },
    { id: 9, name: '참외', initials: 'ㅊㅇ', variety: '오복', tray: 50, spec: '50구', unit: 'tray', price: 21000, stock: 12, safety: 8, growing: 32, useCount: 54, memo: '' },
    { id: 10, name: '양배추', initials: 'ㅇㅂㅊ', variety: 'YR녹천', tray: 128, spec: '128구', unit: 'tray', price: 11000, stock: 40, safety: 20, growing: 35, useCount: 76, memo: '' },
    { id: 11, name: '상추', initials: 'ㅅㅊ', variety: '청축면', tray: 200, spec: '200구', unit: 'tray', price: 9000, stock: 56, safety: 25, growing: 28, useCount: 92, memo: '' },
    { id: 12, name: '대파', initials: 'ㄷㅍ', variety: '조선대파', tray: 200, spec: '200구', unit: 'tray', price: 8000, stock: 78, safety: 30, growing: 60, useCount: 64, memo: '' },
    { id: 13, name: '브로콜리', initials: 'ㅂㄹㅋㄹ', variety: 'SK3호', tray: 128, spec: '128구', unit: 'tray', price: 12000, stock: 22, safety: 15, growing: 35, useCount: 38, memo: '' },
    { id: 14, name: '쪽파', initials: 'ㅉㅍ', variety: '', tray: 200, spec: '200구', unit: 'tray', price: 7500, stock: 30, safety: 20, growing: 40, useCount: 41, memo: '' },
  ],
  recentItems: [3, 1, 4, 6, 7],
  favoriteItems: [3, 1, 4, 6, 11, 5, 7, 10, 12, 8],
  sowings: [
    { id: 1, itemId: 1, sowDate: '2026.03.14', shipDate: '2026.05.08', trays: 12, traySize: 50, status: 'growing', memo: '발아 양호' },
    { id: 2, itemId: 4, sowDate: '2026.04.01', shipDate: '2026.05.11', trays: 8, traySize: 50, status: 'growing', memo: '' },
    { id: 3, itemId: 6, sowDate: '2026.04.12', shipDate: '2026.05.10', trays: 14, traySize: 50, status: 'growing', memo: '' },
    { id: 4, itemId: 11, sowDate: '2026.04.18', shipDate: '2026.05.16', trays: 22, traySize: 200, status: 'growing', memo: '' },
    { id: 5, itemId: 8, sowDate: '2026.04.06', shipDate: '2026.05.08', trays: 10, traySize: 50, status: 'growing', memo: '접목묘' },
    { id: 6, itemId: 5, sowDate: '2026.04.08', shipDate: '2026.05.18', trays: 6, traySize: 72, status: 'growing', memo: '' },
    { id: 7, itemId: 10, sowDate: '2026.04.20', shipDate: '2026.05.25', trays: 18, traySize: 128, status: 'growing', memo: '' },
    { id: 8, itemId: 13, sowDate: '2026.04.22', shipDate: '2026.05.27', trays: 8, traySize: 128, status: 'germinating', memo: '' },
    { id: 9, itemId: 7, sowDate: '2026.03.20', shipDate: '2026.05.14', trays: 4, traySize: 72, status: 'growing', memo: '' },
    { id: 10, itemId: 9, sowDate: '2026.04.10', shipDate: '2026.05.12', trays: 6, traySize: 50, status: 'growing', memo: '' },
  ],
  transactions: [
    { id: 9012, date: '2026.05.06', customerId: 5, total: 740000, paid: 740000, method: 'transfer', items: 4, lines: [], memo: '' },
    { id: 9011, date: '2026.05.05', customerId: 2, total: 1240000, paid: 0, method: 'credit', items: 6, lines: [], memo: '' },
    { id: 9010, date: '2026.05.05', customerId: 7, total: 480000, paid: 480000, method: 'cash', items: 3, lines: [], memo: '' },
    { id: 9009, date: '2026.05.04', customerId: 1, total: 320000, paid: 0, method: 'credit', items: 2, lines: [], memo: '' },
    { id: 9008, date: '2026.05.04', customerId: 3, total: 195000, paid: 195000, method: 'cash', items: 2, lines: [], memo: '' },
    { id: 9007, date: '2026.05.02', customerId: 7, total: 360000, paid: 360000, method: 'transfer', items: 2, lines: [], memo: '' },
    { id: 9006, date: '2026.05.01', customerId: 4, total: 180000, paid: 0, method: 'credit', items: 1, lines: [], memo: '' },
    { id: 9005, date: '2026.04.30', customerId: 6, total: 95000, paid: 0, method: 'credit', items: 1, lines: [], memo: '' },
  ],
  payments: [],
  stockMovements: [],
  templates: [
    { id: 1, name: '한빛농협 정기납품', desc: '청양고추·토마토·오이 정기 5종', customerId: 2, lines: [{ itemId: 1, qty: 30 }, { itemId: 4, qty: 15 }, { itemId: 6, qty: 20 }] },
    { id: 2, name: '김농부 단골 묶음', desc: '고추 50구 + 상추 200구', customerId: 1, lines: [{ itemId: 1, qty: 10 }, { itemId: 11, qty: 5 }] },
  ],
  nextTransactionId: 9013,
  nextCustomerId: 9,
  nextItemId: 15,
  nextSowingId: 11,
  monthlyTotal: 12480000,
  monthlyPaid: 9620000,
  monthlyDue: 2860000,
  dailyRevenue: [
    ['04.24', 410000], ['04.25', 520000], ['04.26', 280000],
    ['04.27', 640000], ['04.28', 720000], ['04.29', 580000],
    ['04.30', 690000], ['05.01', 880000], ['05.02', 920000],
    ['05.03', 540000], ['05.04', 1075000], ['05.05', 1720000],
    ['05.06', 740000], ['05.07', 0],
  ],
});

// Convenience accessors against Store.state
window.findItem = (id) => (window.Store?.state?.items || []).find(i => i.id === id);
window.findCustomer = (id) => (window.Store?.state?.customers || []).find(c => c.id === id);

window.tierLabel = (tier) => tier === 'wholesale' ? '도매가' : tier === 'regular' ? '단골가' : '일반가';
window.tierMultiplier = (tier) => tier === 'wholesale' ? 0.85 : tier === 'regular' ? 0.93 : 1;
window.priceFor = (item, customer) => {
  if (!item) return 0;
  return Math.round(item.price * window.tierMultiplier(customer?.tier || 'standard'));
};
