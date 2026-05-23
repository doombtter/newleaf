// 단가 모델: 품목 단가1/2/3 + 거래처 priceLevel + 전용단가 override
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;
app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));
  const r = await win.webContents.executeJavaScript(`(async ()=>{
    const s=window.Store.state;
    s.customers.push({ id:1, name:'A', priceLevel:1, due:0 });
    s.customers.push({ id:2, name:'B', priceLevel:3, due:0 });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', spec:'50구', price1:10000, price2:9000, price3:8000, stock:0, safety:0, growing:0, useCount:0 });
    s.nextItemId=2; s.nextCustomerId=3;
    const it=window.findItem(1), A=window.findCustomer(1), B=window.findCustomer(2);
    const a=window.priceFor(it,A);   // 단가1 = 10000
    const b=window.priceFor(it,B);   // 단가3 = 8000
    window.setCustomerPrice(1,1,7777); await window.Store.commit();
    const ax=window.priceFor(it,A);  // 전용가 7777
    const bx=window.priceFor(it,B);  // B 영향없음 8000
    window.setCustomerPrice(1,1,''); // 비우면 레벨가 복귀
    const aback=window.priceFor(it,A); // 10000
    return { a, b, ax, bx, aback };
  })()`);
  console.log('R ' + JSON.stringify(r));
  exitCode = (r.a===10000 && r.b===8000 && r.ax===7777 && r.bx===8000 && r.aback===10000) ? 0 : 1;
  console.log(exitCode===0?'PASS':'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
