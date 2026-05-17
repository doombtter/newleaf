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
    await new Promise(r=>setTimeout(r,600)); return true;
  })()`);
  await win.webContents.emulateMedia('print');
  await new Promise(r => setTimeout(r, 300));
  const m = await win.webContents.executeJavaScript(`(()=>{
    const p=document.querySelector('.invoice-page');
    const cs=getComputedStyle(p);
    const tbl=document.querySelector('.invoice-table');
    const fill=document.querySelector('.invoice-table tr.inv-fill td');
    return {
      pageRect: p.getBoundingClientRect().height,
      pageCssH: cs.height, pageDisplay: cs.display,
      tableRect: tbl.getBoundingClientRect().height,
      fillRect: fill ? fill.getBoundingClientRect().height : 'na',
      printPrintWrap: getComputedStyle(document.querySelector('.invoice-print')).position,
      winInner: window.innerHeight, winInnerW: window.innerWidth,
    };
  })()`);
  console.log('M ' + JSON.stringify(m));
  await win.webContents.emulateMedia('screen');
  app.quit();
});
app.on('window-all-closed', () => process.exit(0));
