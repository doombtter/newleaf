// 거래명세서 모달을 열고 printToPDF → PDF가 명세표인지 확인
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
require('../main.js');
let exitCode = 1;

app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));

  await win.webContents.executeJavaScript(`(async ()=>{
    const s=window.Store.state;
    s.customers.push({ id:1, name:'테스트농원', owner:'홍길동', phone:'010-1', address:'전주', type:'individual', tier:'standard', due:0, last:'', memo:'' });
    s.items.push({ id:1, name:'청양고추', initials:'ㅊㅇㄱㅊ', variety:'녹광', tray:50, spec:'50구', unit:'tray', price:15000, stock:80, safety:10, growing:55, useCount:0, memo:'' });
    s.nextItemId=2; s.nextCustomerId=2;
    const tx={ id:s.nextTransactionId++, date:window.todayKey(), customerId:1, subtotal:45000, vat:4500, total:49500, paid:49500, method:'cash', items:1, lines:[{itemId:1,name:'청양고추 · 녹광',spec:'50구',qty:3,price:15000,lineTotal:45000}], memo:'' };
    s.transactions.unshift(tx);
    await window.Store.commit();
    // 거래처 화면으로 이동(뒤에 깔린 화면) 후 인보이스 모달 오픈
    const nav=[...document.querySelectorAll('.nav-item')].find(n=>n.textContent.includes('거래처')); nav && nav.click();
    await new Promise(r=>setTimeout(r,300));
    const host=document.createElement('div'); document.body.appendChild(host);
    ReactDOM.createRoot(host).render(React.createElement(window.InvoiceModal,{ data: window.txToInvoice(tx), onClose:()=>{} }));
    await new Promise(r=>setTimeout(r,600));
    return true;
  })()`);

  const pdf = await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true });
  fs.writeFileSync('/tmp/print-test.pdf', pdf);
  console.log('pdf bytes', pdf.length);
  app.quit();
});
app.on('window-all-closed', () => { exitCode = 0; process.exit(exitCode); });
