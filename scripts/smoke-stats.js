// 부가세 있음/없음, 통계 사용자지정 기간, 데이터 조회 모달 검증
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;

app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));

  const r = await win.webContents.executeJavaScript(`(async ()=>{
    const s=window.Store.state;
    s.customers.push({ id:1, name:'테스트', owner:'', phone:'', address:'', type:'individual', tier:'standard', due:0, last:'', memo:'' });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', variety:'', tray:50, spec:'50구', unit:'tray', price:10000, stock:100, safety:10, growing:50, useCount:0, memo:'' });
    s.nextItemId=2; s.nextCustomerId=2;
    // 오늘 거래(부가세 있음): 2개*10000=20000, vat 2000, total 22000
    s.transactions.unshift({ id:s.nextTransactionId++, date:window.todayKey(), customerId:1, subtotal:20000, vat:2000, total:22000, paid:22000, method:'cash', hasVat:true, items:1, lines:[{itemId:1,name:'고추',spec:'50구',qty:2,price:10000,lineTotal:20000}], memo:'' });
    // 30일 전 거래(부가세 없음): total 15000
    const d=new Date(); d.setDate(d.getDate()-30);
    const k=\`\${d.getFullYear()}.\${String(d.getMonth()+1).padStart(2,'0')}.\${String(d.getDate()).padStart(2,'0')}\`;
    s.transactions.push({ id:s.nextTransactionId++, date:k, customerId:1, subtotal:15000, vat:0, total:15000, paid:0, method:'credit', hasVat:false, items:1, lines:[{itemId:1,name:'고추',spec:'50구',qty:1,price:15000,lineTotal:15000}], memo:'' });
    await window.Store.commit();
    return { oldKey:k };
  })()`);

  // 통계로 이동, 사용자지정 기간으로 30일전 거래만 포함되게
  const stat = await win.webContents.executeJavaScript(`(async ()=>{
    const nav=[...document.querySelectorAll('.nav-item')].find(n=>n.textContent.includes('매출')); nav&&nav.click();
    await new Promise(r=>setTimeout(r,300));
    // '이번 달' 기준: 오늘 거래만(22000) 포함, 30일전은 보통 제외(말일 근처 예외 가능)
    const monthSales = [...document.querySelectorAll('.stat')].map(e=>e.textContent).join(' ');
    // 사용자 지정 버튼 클릭
    const btn=[...document.querySelectorAll('.seg button')].find(b=>b.textContent.includes('사용자 지정'));
    btn && btn.click();
    await new Promise(r=>setTimeout(r,300));
    const dateInputs=document.querySelectorAll('input[type=date]');
    return { hasCustomInputs: dateInputs.length===2, monthSalesText: monthSales.slice(0,120) };
  })()`);

  // 데이터 조회 모달
  const viewer = await win.webContents.executeJavaScript(`(async ()=>{
    const v=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('화면 조회'));
    if(!v) return { open:false };
    v.click();
    await new Promise(r=>setTimeout(r,300));
    const head=document.querySelector('.modal-head')?.textContent||'';
    const rows=document.querySelectorAll('.modal table.tx tbody tr').length;
    return { open: head.length>0, head, rows };
  })()`);

  console.log('stat:', JSON.stringify(stat));
  console.log('viewer:', JSON.stringify(viewer));

  const pass = stat.hasCustomInputs && viewer.open && viewer.rows > 0;
  exitCode = pass ? 0 : 1;
  console.log(pass ? 'PASS' : 'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
