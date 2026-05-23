// 상자 공제 + 기본값(외상/부가세없음) + 이전미수금 표시 검증
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;
app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));

  // 거래처(이전 미수금 5000)/품목 준비 후 거래입력 화면 진입
  const def = await win.webContents.executeJavaScript(`(async ()=>{
    const s=window.Store.state;
    s.customers.push({ id:1, name:'A', priceLevel:1, due:5000 });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', spec:'50구', price1:10000, price2:9000, price3:8000, stock:0, safety:0, growing:0, useCount:0 });
    s.nextItemId=2; s.nextCustomerId=2; await window.Store.commit();
    const nav=[...document.querySelectorAll('.nav-item')].find(n=>n.textContent.includes('거래 입력')); nav&&nav.click();
    await new Promise(r=>setTimeout(r,400));
    const segOn=[...document.querySelectorAll('.seg button.on')].map(b=>b.textContent);
    const prevDueShown=document.querySelector('.content').textContent.includes('5,000');
    return { segOn, prevDueShown };
  })()`);

  // txToInvoice로 상자공제/이전미수금 계산 확인 (charged = full - box*500)
  const calc = await win.webContents.executeJavaScript(`(()=>{
    const tx={ id:1, date:'2026.05.22', customerId:1, subtotal:30000, vat:0, fullTotal:30000, boxCount:4, boxDeduct:2000, total:28000, prevDue:5000, paid:0, method:'credit', lines:[{itemId:1,name:'고추',spec:'50구',qty:3,price:10000,lineTotal:30000}] };
    const inv=window.txToInvoice(tx);
    return { headerTotal:inv.total, exBox:inv.exBoxTotal, prevDue:inv.prevDue, box:inv.boxCount };
  })()`);

  console.log('DEF ' + JSON.stringify(def));
  console.log('CALC ' + JSON.stringify(calc));

  const defOk = def.segOn.some(t=>t.includes('외상')) && def.segOn.some(t=>t.includes('부가세 없음')) && def.prevDueShown;
  const calcOk = calc.headerTotal===30000 && calc.exBox===28000 && calc.prevDue===5000 && calc.box===4;
  exitCode = (defOk && calcOk) ? 0 : 1;
  console.log('defOk',defOk,'calcOk',calcOk,'=>',exitCode===0?'PASS':'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
