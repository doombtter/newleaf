// 거래처별 품목 집계 모달: 월별/연별/기간 검증
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;

app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));

  await win.webContents.executeJavaScript(`(async ()=>{
    const s=window.Store.state;
    s.customers.push({ id:1, name:'가나농원', owner:'', phone:'', address:'', type:'individual', tier:'standard', due:0, last:'', memo:'' });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', variety:'', tray:50, spec:'50구', unit:'tray', price:10000, stock:99, safety:5, growing:50, useCount:0, memo:'' });
    s.items.push({ id:2, name:'토마토', initials:'ㅌㅁㅌ', variety:'', tray:50, spec:'50구', unit:'tray', price:8000, stock:99, safety:5, growing:40, useCount:0, memo:'' });
    s.nextItemId=3; s.nextCustomerId=2;
    // 2026.01 고추3, 2026.03 토마토2, 2025.05 고추1
    s.transactions.push({ id:s.nextTransactionId++, date:'2026.01.10', customerId:1, subtotal:30000, vat:3000, total:33000, paid:33000, method:'cash', hasVat:true, items:1, lines:[{itemId:1,name:'고추',spec:'50구',qty:3,price:10000,lineTotal:30000}], memo:'' });
    s.transactions.push({ id:s.nextTransactionId++, date:'2026.03.05', customerId:1, subtotal:16000, vat:1600, total:17600, paid:0, method:'credit', hasVat:true, items:1, lines:[{itemId:2,name:'토마토',spec:'50구',qty:2,price:8000,lineTotal:16000}], memo:'' });
    s.transactions.push({ id:s.nextTransactionId++, date:'2025.05.20', customerId:1, subtotal:10000, vat:0, total:10000, paid:10000, method:'cash', hasVat:false, items:1, lines:[{itemId:1,name:'고추',spec:'50구',qty:1,price:10000,lineTotal:10000}], memo:'' });
    await window.Store.commit();
    const nav=[...document.querySelectorAll('.nav-item')].find(n=>n.textContent.includes('매출')); nav&&nav.click();
    await new Promise(r=>setTimeout(r,300));
    const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('거래처별 품목 집계')) || [...document.querySelectorAll('button')].find(x=>x.textContent.includes('화면 조회') && x.closest('.alert-card')?.textContent.includes('거래처별 품목'));
    // 카드의 '화면 조회' 클릭
    const card=[...document.querySelectorAll('.alert-card')].find(c=>c.textContent.includes('거래처별 품목 집계'));
    card.querySelector('button').click();
    await new Promise(r=>setTimeout(r,300));
    return true;
  })()`);

  const monthRows = await win.webContents.executeJavaScript(`(()=>{
    const rows=[...document.querySelectorAll('.modal table.tx tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent.trim()));
    return JSON.stringify(rows);
  })()`);

  const yearRows = await win.webContents.executeJavaScript(`(async ()=>{
    const yb=[...document.querySelectorAll('.modal .seg button')].find(b=>b.textContent.includes('연별'));
    yb.click(); await new Promise(r=>setTimeout(r,250));
    const rows=[...document.querySelectorAll('.modal table.tx tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent.trim()));
    return JSON.stringify(rows);
  })()`);

  console.log('MONTH', monthRows);
  console.log('YEAR', yearRows);

  const m = JSON.parse(monthRows), y = JSON.parse(yearRows);
  // 월별: 2025.05 고추1, 2026.01 고추3, 2026.03 토마토2 + 합계행
  const monthOk = m.some(r => r[0] === '2026.01' && r[1].includes('고추') && r[2] === '3') &&
                  m.some(r => r[0] === '2026.03' && r[1].includes('토마토') && r[2] === '2') &&
                  m.some(r => r[0] === '2025.05' && r[1].includes('고추') && r[2] === '1');
  // 연별: 2025년 고추1, 2026년 고추3+토마토2
  const yearOk = y.some(r => r[0] === '2025년' && r[1].includes('고추') && r[2] === '1') &&
                 y.some(r => r[0] === '2026년' && r[1].includes('고추') && r[2] === '3') &&
                 y.some(r => r[0] === '2026년' && r[1].includes('토마토') && r[2] === '2');
  exitCode = (monthOk && yearOk) ? 0 : 1;
  console.log('monthOk', monthOk, 'yearOk', yearOk, '=>', exitCode === 0 ? 'PASS' : 'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
