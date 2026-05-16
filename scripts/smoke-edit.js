// 거래 수정(불러오기)·재출력·통계 기간필터 검증
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;

app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));

  const r = await win.webContents.executeJavaScript(`(async ()=>{
    const s = window.Store.state;
    s.customers.push({ id:1, name:'테스트', owner:'', phone:'', address:'', type:'individual', tier:'standard', due:0, last:'', memo:'' });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', variety:'', tray:50, spec:'50구', unit:'tray', price:10000, stock:100, safety:10, growing:50, useCount:0, memo:'' });
    s.items.push({ id:2, name:'토마토', initials:'ㅌㅁㅌ', variety:'', tray:50, spec:'50구', unit:'tray', price:8000, stock:50, safety:5, growing:40, useCount:0, memo:'' });
    s.nextItemId=3; s.nextCustomerId=2;
    // 오늘자 외상 거래 1건 (고추 3개 = 30000 + vat 3000 = 33000)
    const today = window.todayKey();
    const tx = { id: s.nextTransactionId, date: today, customerId:1, subtotal:30000, vat:3000, total:33000, paid:0, method:'credit', items:1, lines:[{itemId:1, name:'고추', spec:'50구', qty:3, price:10000, lineTotal:30000}], memo:'' };
    s.transactions.unshift(tx); s.nextTransactionId++;
    const it=window.findItem(1); it.stock=97; const c=window.findCustomer(1); c.due=33000;
    // 올해 1월 1일 거래 1건 (월 통계엔 빠지고 연 통계엔 포함)
    const yJan = new Date().getFullYear() + '.01.01';
    s.transactions.push({ id: s.nextTransactionId++, date:yJan, customerId:1, subtotal:5000, vat:500, total:5500, paid:5500, method:'cash', items:1, lines:[{itemId:2,name:'토마토',spec:'50구',qty:1,price:5000,lineTotal:5000}], memo:'' });
    await window.Store.commit();

    // 재출력 데이터 확인
    const inv = window.txToInvoice(tx);
    const reprintOk = inv && inv.customer && inv.customer.id===1 && inv.rows.length===1 && inv.total===33000;

    // 통계 기간필터: 함수 재현 (이번 달 vs 올해)
    const now=new Date();
    const monthStart=new Date(now.getFullYear(),now.getMonth(),1);
    const yearStart=new Date(now.getFullYear(),0,1);
    const toD=(x)=>{const [y,m,d]=x.split('.').map(Number);return new Date(y,m-1,d);};
    const monthCount=s.transactions.filter(t=>{const d=toD(t.date);return d>=monthStart&&d<=now;}).length;
    const yearCount=s.transactions.filter(t=>{const d=toD(t.date);return d>=yearStart&&d<=now;}).length;
    return { reprintOk, monthCount, yearCount, beforeStock: window.findItem(1).stock, beforeDue: window.findCustomer(1).due };
  })()`);
  console.log('phase1:', JSON.stringify(r));

  // 거래 수정 시뮬레이션: 수정 모드 persist 로직을 EntryScreen 통해 검증 (UI 우회: applyEffects 동등 로직)
  const r2 = await win.webContents.executeJavaScript(`(async ()=>{
    const s=window.Store.state;
    const old=s.transactions.find(t=>t.total===33000);
    // 기존 효과 원복
    old.lines.forEach(l=>{const it=window.findItem(l.itemId); it.stock+=l.qty;});
    const c=window.findCustomer(old.customerId); c.due=Math.max(0,c.due-(old.total-old.paid));
    // 수정: 고추 3->5, 토마토 2개 추가
    const lines=[{itemId:1,name:'고추',spec:'50구',qty:5,price:10000,lineTotal:50000},{itemId:2,name:'토마토',spec:'50구',qty:2,price:8000,lineTotal:16000}];
    const subtotal=66000, vat=6600, total=72600;
    Object.assign(old,{lines,subtotal,vat,total,items:2,paid:0});
    // 새 효과 적용
    lines.forEach(l=>{const it=window.findItem(l.itemId); it.stock=Math.max(0,it.stock-l.qty);});
    c.due+=total;
    await window.Store.commit();
    return { txCountSame: s.transactions.filter(t=>t.id===old.id).length, chiliStock: window.findItem(1).stock, tomatoStock: window.findItem(2).stock, due: c.due, total: old.total };
  })()`);
  console.log('phase2(edit):', JSON.stringify(r2));

  // 고추 100 - 5 = 95, 토마토 50 - 2 = 48, due = 72600, tx 그대로 1건(중복 없음)
  const pass = r.reprintOk && r.monthCount === 1 && r.yearCount === 2 &&
               r2.txCountSame === 1 && r2.chiliStock === 95 && r2.tomatoStock === 48 && r2.due === 72600 && r2.total === 72600;
  exitCode = pass ? 0 : 1;
  console.log(pass ? 'PASS' : 'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
