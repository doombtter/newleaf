const { app, BrowserWindow } = require('electron');
require('../main.js');
const fs = require('fs');
app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));
  await win.webContents.executeJavaScript(`(async ()=>{
    const s=window.Store.state;
    s.customers.push({ id:1, name:'A', priceLevel:1, owner:'홍', phone:'1', address:'전주', due:0 });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', spec:'50구', price1:1000, price2:1000, price3:1000, stock:0,safety:0,growing:0,useCount:0 });
    const lines=Array.from({length:50}).map((_,i)=>({itemId:1,name:'품목'+(i+1),spec:'50구',qty:1,price:1000,lineTotal:1000}));
    const tx={ id:1, date:window.todayKey(), customerId:1, subtotal:50000, vat:0, fullTotal:50000, boxCount:0, boxDeduct:0, total:50000, prevDue:0, paid:0, method:'credit', items:50, lines };
    s.transactions.unshift(tx); await window.Store.commit();
    const host=document.createElement('div'); document.body.appendChild(host);
    ReactDOM.createRoot(host).render(React.createElement(window.InvoiceModal,{ data: window.txToInvoice(tx), onClose:()=>{} }));
    await new Promise(r=>setTimeout(r,500)); return true;
  })()`);
  const pdf = await win.webContents.printToPDF({ pageSize:'A4', printBackground:true, margins:{marginType:'none'} });
  fs.writeFileSync('/tmp/multi.pdf', pdf);
  console.log('pdf bytes', pdf.length);
  app.quit();
});
app.on('window-all-closed', () => process.exit(0));
