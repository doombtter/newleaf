// 인쇄 매체 에뮬레이션 후 invoice-page/행 실제 크기 측정
const { app, BrowserWindow } = require('electron');
require('../main.js');
app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));
  await win.webContents.executeJavaScript(`(async ()=>{
    const s=window.Store.state;
    s.customers.push({ id:1, name:'테스트', owner:'홍', phone:'1', address:'전주', type:'individual', tier:'standard', due:0, last:'', memo:'' });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', variety:'', tray:50, spec:'50구', unit:'tray', price:15000, stock:80, safety:10, growing:55, useCount:0, memo:'' });
    const tx={ id:s.nextTransactionId++, date:window.todayKey(), customerId:1, subtotal:45000, vat:4500, total:49500, paid:49500, method:'cash', hasVat:true, items:1, lines:[{itemId:1,name:'고추',spec:'50구',qty:3,price:15000,lineTotal:45000}], memo:'' };
    s.transactions.unshift(tx); await window.Store.commit();
    const host=document.createElement('div'); document.body.appendChild(host);
    ReactDOM.createRoot(host).render(React.createElement(window.InvoiceModal,{ data: window.txToInvoice(tx), onClose:()=>{} }));
    await new Promise(r=>setTimeout(r,500));
    return true;
  })()`);
  await win.webContents.debugger.attach('1.3').catch(()=>{});
  await win.webContents.executeJavaScript(`true`);
  await win.webContents.emulateMedia ? null : null;
  const r = await win.webContents.executeJavaScript(`(async ()=>{
    return { note: 'pre' };
  })()`);
  // emulate print
  await win.webContents.emulateMedia?.('print');
  const m = await win.webContents.executeJavaScript(`(()=>{
    const p=document.querySelector('.invoice-page');
    const cs=getComputedStyle(p);
    const tds=document.querySelectorAll('.invoice-table tbody tr td');
    const firstEmpty=document.querySelector('.invoice-table tr.empty td');
    const tbl=document.querySelector('.invoice-table');
    return {
      pageH: p.getBoundingClientRect().height,
      pageCssHeight: cs.height,
      pageMinH: cs.minHeight,
      rowCount: document.querySelectorAll('.invoice-table tbody tr').length,
      emptyTdH: firstEmpty ? getComputedStyle(firstEmpty).height : 'n/a',
      tableH: tbl.getBoundingClientRect().height,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      htmlBg: getComputedStyle(document.documentElement).backgroundColor,
    };
  })()`);
  console.log('MEASURE', JSON.stringify(m));
  app.quit();
});
app.on('window-all-closed', () => process.exit(0));
