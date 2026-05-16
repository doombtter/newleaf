// Functional: add customer + item programmatically, persist, reload, verify
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;

app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 5000));

  const r1 = await win.webContents.executeJavaScript(`(async ()=>{
    const s = window.Store.state;
    s.customers.push({ id:1, name:'테스트농원', owner:'홍길동', phone:'010-0000-0000', address:'전주', type:'individual', tier:'standard', due:0, last:'', memo:'' });
    s.items.push({ id:1, name:'청양고추', initials:window.getInitials('청양고추'), variety:'녹광', tray:50, spec:'50구', unit:'tray', price:15000, stock:30, safety:10, growing:55, useCount:0, memo:'' });
    s.nextCustomerId=2; s.nextItemId=2;
    await window.Store.commit();
    return { customers:s.customers.length, items:s.items.length };
  })()`);
  console.log('after add:', JSON.stringify(r1));

  await win.webContents.reload();
  await new Promise(r => setTimeout(r, 5000));

  const r2 = await win.webContents.executeJavaScript(`(()=>{
    const s = window.Store.state;
    // navigate to entry
    const nav=[...document.querySelectorAll('.nav-item')].find(n=>n.textContent.includes('거래 입력'));
    if(nav) nav.click();
    return { persistedCustomers:s.customers.length, persistedItems:s.items.length };
  })()`);
  await new Promise(r => setTimeout(r, 500));
  const r3 = await win.webContents.executeJavaScript(`(()=>{
    return { hasEntryGrid: !!document.querySelector('.entry-grid'), hasEmptyHint: document.querySelector('.content').textContent.includes('먼저 거래처와 품목') };
  })()`);
  console.log('after reload:', JSON.stringify(r2), 'entry:', JSON.stringify(r3));

  exitCode = (r1.customers===1 && r2.persistedCustomers===1 && r2.persistedItems===1 && r3.hasEntryGrid && !r3.hasEmptyHint) ? 0 : 1;
  console.log(exitCode===0 ? 'PASS' : 'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
