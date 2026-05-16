// 옛 v1 샘플 데이터가 깔린 상태에서 실행 → v2 빈 상태로 자동 정리되는지 검증
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(app.getPath('userData'), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dataFile = path.join(dataDir, 'saeipari.json');
// 이전 버전(샘플 포함) 모사
fs.writeFileSync(dataFile, JSON.stringify({
  schemaVersion: 1,
  customers: [{ id: 1, name: '샘플거래처', due: 999 }],
  items: [{ id: 1, name: '샘플품목' }],
  transactions: [{ id: 1, total: 5000 }],
  sowings: [], payments: [], stockMovements: [], templates: [],
}));

require('../main.js');
let exitCode = 1;

app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 5000));

  const r = await win.webContents.executeJavaScript(`(()=>{
    const s = window.Store.state;
    return { schema: s.schemaVersion, customers: s.customers.length, items: s.items.length, tx: s.transactions.length };
  })()`);
  console.log('AFTER MIGRATION:', JSON.stringify(r));

  // 디스크에도 빈 v2가 기록됐는지
  const disk = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  console.log('DISK:', JSON.stringify({ schema: disk.schemaVersion, customers: disk.customers.length, items: disk.items.length }));

  exitCode = (r.schema === 2 && r.customers === 0 && r.items === 0 && r.tx === 0 && disk.schemaVersion === 2 && disk.customers.length === 0) ? 0 : 1;
  console.log(exitCode === 0 ? 'PASS' : 'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
