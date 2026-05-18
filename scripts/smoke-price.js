// 거래처별 전용 단가: 설정 → priceFor 반영 → 영속화 검증
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;
app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));
  const r = await win.webContents.executeJavaScript(`(async ()=>{
    const s=window.Store.state;
    s.customers.push({ id:1, name:'A', owner:'', phone:'', address:'', type:'individual', tier:'standard', due:0, last:'', memo:'' });
    s.customers.push({ id:2, name:'B', owner:'', phone:'', address:'', type:'wholesale', tier:'wholesale', due:0, last:'', memo:'' });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', variety:'', tray:50, spec:'50구', unit:'tray', price:10000, stock:9, safety:1, growing:1, useCount:0, memo:'' });
    s.nextItemId=2; s.nextCustomerId=3;
    const it=window.findItem(1), A=window.findCustomer(1), B=window.findCustomer(2);
    const autoA=window.priceFor(it,A);            // standard ×1 = 10000
    const autoB=window.priceFor(it,B);            // wholesale ×0.85 = 8500
    window.setCustomerPrice(1,1,7777);            // A 전용가
    await window.Store.commit();
    const explicitA=window.priceFor(it,A);        // 7777
    const stillB=window.priceFor(it,B);           // 8500 (unaffected)
    window.setCustomerPrice(1,1,'');              // 비우면 자동 복귀
    const backA=window.priceFor(it,A);            // 10000
    return { autoA, autoB, explicitA, stillB, backA };
  })()`);
  console.log('R ' + JSON.stringify(r));
  exitCode = (r.autoA===10000 && r.autoB===8500 && r.explicitA===7777 && r.stillB===8500 && r.backA===10000) ? 0 : 1;
  console.log(exitCode===0?'PASS':'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
