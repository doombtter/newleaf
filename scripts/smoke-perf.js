// 시작 속도 + 삭제 동작 검증
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;

app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];

  // poll until .sidebar exists, measure ms from now
  const t0 = Date.now();
  let ready = false;
  for (let i = 0; i < 100; i++) {
    const has = await win.webContents.executeJavaScript(`!!document.querySelector('.sidebar')`).catch(() => false);
    if (has) { ready = true; break; }
    await new Promise(r => setTimeout(r, 100));
  }
  const mountMs = Date.now() - t0;
  console.log('mount after window:', mountMs, 'ms, ready:', ready);

  // seed a customer+item+credit transaction, then delete it and check restore
  const r = await win.webContents.executeJavaScript(`(async ()=>{
    const s = window.Store.state;
    s.customers.push({ id:1, name:'테스트', owner:'', phone:'', address:'', type:'individual', tier:'standard', due:0, last:'', memo:'' });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', variety:'', tray:50, spec:'50구', unit:'tray', price:10000, stock:100, safety:10, growing:50, useCount:0, memo:'' });
    const tx = { id:1, date:window.todayKey(), customerId:1, subtotal:30000, vat:3000, total:33000, paid:0, method:'credit', items:1, lines:[{itemId:1, name:'고추', spec:'50구', qty:3, price:10000, lineTotal:30000}], memo:'' };
    s.transactions.unshift(tx);
    const c = window.findCustomer(1); c.due = 33000;
    const it = window.findItem(1); it.stock = 97;
    await window.Store.commit();
    const beforeStock = it.stock, beforeDue = c.due, beforeTxN = s.transactions.length;
    window.removeTransaction(1);
    await window.Store.commit();
    return { beforeStock, beforeDue, beforeTxN, afterStock: window.findItem(1).stock, afterDue: window.findCustomer(1).due, afterTxN: s.transactions.length };
  })()`);
  console.log('delete-tx:', JSON.stringify(r));

  const okPerf = ready && mountMs <= 2500;
  const okDelete = r.afterStock === 100 && r.afterDue === 0 && r.afterTxN === 0;
  exitCode = (okPerf && okDelete) ? 0 : 1;
  console.log('PERF', okPerf ? 'OK' : 'SLOW', '| DELETE', okDelete ? 'OK' : 'FAIL', '=>', exitCode === 0 ? 'PASS' : 'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
