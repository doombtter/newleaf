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

// 천단위 쉼표 — 환경(ICU/로케일)에 의존하지 않도록 수동 처리
window.fmt = (n) => {
  const num = Number(n);
  if (!isFinite(num)) return '0';
  const neg = num < 0;
  const s = String(Math.round(Math.abs(num))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + s;
};

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
  customerPrices: {},
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

// 삭제 (이력 정합성 보정 포함)
window.removeItem = (id) => {
  const s = window.Store.state;
  s.items = s.items.filter(i => i.id !== id);
  s.recentItems = (s.recentItems || []).filter(x => x !== id);
  s.favoriteItems = (s.favoriteItems || []).filter(x => x !== id);
};
window.removeCustomer = (id) => {
  const s = window.Store.state;
  s.customers = s.customers.filter(c => c.id !== id);
};
window.removeTransaction = (id) => {
  const s = window.Store.state;
  const tx = s.transactions.find(t => t.id === id);
  if (!tx) return;
  // 재고 복원
  (tx.lines || []).forEach(l => {
    const it = window.findItem(l.itemId);
    if (it) it.stock = (it.stock || 0) + Number(l.qty || 0);
  });
  // 외상 미수금 환원
  if (tx.method === 'credit') {
    const c = window.findCustomer(tx.customerId);
    if (c) {
      const outstanding = Math.max(0, (tx.total || 0) - (tx.paid || 0));
      c.due = Math.max(0, (c.due || 0) - outstanding);
    }
  }
  s.transactions = s.transactions.filter(t => t.id !== id);
};

// 저장된 거래 → 거래명세서 미리보기 데이터
window.txToInvoice = (tx) => {
  if (!tx) return null;
  const fullTotal = (tx.fullTotal != null) ? tx.fullTotal : ((tx.subtotal || 0) + (tx.vat || 0));
  const exBoxTotal = (tx.total != null) ? tx.total : fullTotal;
  return {
    customer: window.findCustomer(tx.customerId),
    date: tx.date,
    rows: (tx.lines || []).map(l => ({ itemId: l.itemId, itemName: l.name, spec: l.spec, qty: l.qty, price: l.price })),
    subtotal: tx.subtotal,
    vat: tx.vat,
    fullTotal,            // 합계금액(VAT 포함, 상자 공제 전)
    total: fullTotal,     // 헤더 합계금액 표기용
    exBoxTotal,           // 상자제외 청구금액
    boxCount: tx.boxCount || 0,
    boxDeduct: tx.boxDeduct || 0,
    prevDue: (tx.prevDue != null) ? tx.prevDue : (window.findCustomer(tx.customerId)?.due || 0),
    payment: tx.method,
    memo: tx.memo,
    txId: tx.id,
  };
};

// 품목별 상자 사용 여부(O/X). 값이 없으면 사용(O)으로 간주 — 기존 데이터 호환
window.itemUsesBox = (item) => !item || item.useBox !== false;

// 단가 레벨(거래처가 단가1/2/3 중 선택)
window.levelLabel = (lv) => `단가${Number(lv) || 1}`;
window.itemLevelPrice = (item, level) => {
  if (!item) return 0;
  const lv = Number(level) || 1;
  const v = item['price' + lv];
  return (v === 0 || v) ? Number(v) : (Number(item.price) || 0);
};

// 호환: 기존 tier 헬퍼 유지(미사용 화면 대비)
window.tierLabel = (tier) => tier === 'wholesale' ? '도매가' : tier === 'regular' ? '단골가' : '일반가';
window.tierMultiplier = (tier) => tier === 'wholesale' ? 0.85 : tier === 'regular' ? 0.93 : 1;

// 거래처별 전용 단가(예외 단가): state.customerPrices[customerId][itemId] = price
window.getCustomerPrice = (itemId, customerId) => {
  const cp = window.Store?.state?.customerPrices;
  const v = cp && cp[customerId] && cp[customerId][itemId];
  return (v === 0 || v) ? Number(v) : undefined;
};
window.setCustomerPrice = (customerId, itemId, price) => {
  const s = window.Store.state;
  if (!s.customerPrices) s.customerPrices = {};
  if (!s.customerPrices[customerId]) s.customerPrices[customerId] = {};
  if (price === '' || price === null || price === undefined || isNaN(Number(price))) {
    delete s.customerPrices[customerId][itemId]; // 비우면 단가 레벨가로 복귀
  } else {
    s.customerPrices[customerId][itemId] = Number(price);
  }
};
window.priceFor = (item, customer) => {
  if (!item) return 0;
  if (customer) {
    const explicit = window.getCustomerPrice(item.id, customer.id);
    if (explicit !== undefined) return explicit;
    return window.itemLevelPrice(item, customer.priceLevel);
  }
  return window.itemLevelPrice(item, 1);
};

// 거래처의 현재 미수금(이 거래 반영 전 잔액) — 미수금 자동 합산 표시용
window.customerDue = (customerId) => {
  const c = window.findCustomer(customerId);
  return c ? (c.due || 0) : 0;
};
