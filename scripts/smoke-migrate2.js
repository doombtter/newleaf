// 보존형 마이그레이션 검증:
//  (A) v2 실데이터 + 미래 필드 누락 → 데이터 보존 + 필드 보충
//  (B) 버전 없는 실데이터 → 보존
//  (C) v1 샘플 → 일회성 폐기(빈 상태)
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(app.getPath('userData'), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dataFile = path.join(dataDir, 'saeipari.json');

const scenario = process.env.SCN || 'A';
if (scenario === 'A') {
  // v2 실데이터, trayPresets 없음(미래 필드 시뮬레이션), nextItemId 낮음
  fs.writeFileSync(dataFile, JSON.stringify({
    schemaVersion: 2,
    customers: [{ id: 5, name: '실거래처', due: 12000 }],
    items: [{ id: 9, name: '실품목', spec: '50구', price: 9000 }],
    transactions: [{ id: 3, date: '2026.05.01', customerId: 5, total: 12000, method: 'credit' }],
    sowings: [], payments: [], stockMovements: [], templates: [],
    nextItemId: 1, nextCustomerId: 1, nextTransactionId: 1, nextSowingId: 1,
  }));
} else if (scenario === 'B') {
  fs.writeFileSync(dataFile, JSON.stringify({
    customers: [{ id: 2, name: '버전없음거래처', due: 0 }],
    items: [{ id: 1, name: '버전없음품목', spec: '72구', price: 7000 }],
    transactions: [],
  }));
} else {
  fs.writeFileSync(dataFile, JSON.stringify({
    schemaVersion: 1,
    customers: [{ id: 1, name: '샘플거래처' }],
    items: [{ id: 1, name: '샘플품목' }],
  }));
}

require('../main.js');
let exitCode = 1;

app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 3000));

  const r = await win.webContents.executeJavaScript(`(()=>{
    const s = window.Store.state;
    return {
      schema: s.schemaVersion,
      customers: s.customers.length,
      items: s.items.length,
      tx: s.transactions.length,
      hasTrayPresets: Array.isArray(s.trayPresets) && s.trayPresets.length > 0,
      nextItemId: s.nextItemId,
      firstItemInitials: s.items[0] && s.items[0].initials,
      firstItemUseCount: s.items[0] && s.items[0].useCount,
    };
  })()`);
  console.log('SCN=' + scenario, JSON.stringify(r));

  let pass = false;
  if (scenario === 'A') {
    pass = r.schema === 2 && r.customers === 1 && r.items === 1 && r.tx === 1 &&
           r.hasTrayPresets && r.nextItemId >= 10 && r.firstItemUseCount === 0 && !!r.firstItemInitials;
  } else if (scenario === 'B') {
    pass = r.customers === 1 && r.items === 1 && r.hasTrayPresets && r.schema === 2;
  } else {
    pass = r.customers === 0 && r.items === 0 && r.schema === 2; // 샘플 폐기
  }
  exitCode = pass ? 0 : 1;
  console.log(pass ? 'PASS' : 'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
