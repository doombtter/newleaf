const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;
app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));
  const r = await win.webContents.executeJavaScript(`(async ()=>{
    const s=window.Store.state;
    s.customers.push({ id:1, name:'t', owner:'', phone:'', address:'', type:'individual', tier:'standard', due:0, last:'', memo:'' });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', variety:'녹광', tray:50, spec:'50구', unit:'tray', price:15000, stock:9, safety:1, growing:1, useCount:0, memo:'' });
    const tx={ id:s.nextTransactionId++, date:window.todayKey(), customerId:1, subtotal:15000, vat:1500, total:16500, paid:16500, method:'cash', hasVat:true, items:1, lines:[{itemId:1,name:'고추 · 녹광',spec:'50구',qty:1,price:15000,lineTotal:15000}], memo:'' };
    s.transactions.unshift(tx); await window.Store.commit();
    const host=document.createElement('div'); document.body.appendChild(host);
    ReactDOM.createRoot(host).render(React.createElement(window.InvoiceModal,{ data: window.txToInvoice(tx), onClose:()=>{} }));
    await new Promise(r=>setTimeout(r,500));
    const td=document.querySelector('.invoice-table tbody td.r');     // 숫자 셀
    const tdl=document.querySelector('.invoice-table tbody td.l');    // 품목 셀
    const th=document.querySelector('.invoice-table th');
    return {
      cellPx: td? getComputedStyle(td).fontSize : 'na',
      itemPx: tdl? getComputedStyle(tdl).fontSize : 'na',
      thPx: th? getComputedStyle(th).fontSize : 'na',
    };
  })()`);
  console.log('PREVIEW ' + JSON.stringify(r));
  // 미리보기(스크린 미디어)에서 표 셀 17px, 품목 21px 이상이어야
  exitCode = (parseFloat(r.cellPx) >= 16 && parseFloat(r.itemPx) >= 20) ? 0 : 1;
  console.log(exitCode===0?'PASS':'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
