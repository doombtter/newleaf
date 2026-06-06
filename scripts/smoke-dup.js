// 중복 저장 방지: 신규 거래를 '저장 후 인쇄' 2번 해도 1건만, 미수금 1회만
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;
app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));

  await win.webContents.executeJavaScript(`(async ()=>{
    window.print = ()=>{}; window.confirm = ()=>true; window.alert = ()=>{};
    const s=window.Store.state;
    s.customers.push({ id:1, name:'A', priceLevel:1, due:0 });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', spec:'50구', price1:10000, price2:10000, price3:10000, stock:0,safety:0,growing:0,useCount:0 });
    s.favoriteItems=[1]; s.nextItemId=2; s.nextCustomerId=2; await window.Store.commit();
    const nav=[...document.querySelectorAll('.nav-item')].find(n=>n.textContent.includes('거래 입력')); nav&&nav.click();
    await new Promise(r=>setTimeout(r,400));
    return true;
  })()`);

  const res = await win.webContents.executeJavaScript(`(async ()=>{
    const fav=[...document.querySelectorAll('.fav-item')][0]; if(fav) fav.click();
    await new Promise(r=>setTimeout(r,150));
    const qty=[...document.querySelectorAll('.row-input.row-num')][0];
    const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    setter.call(qty,'2'); qty.dispatchEvent(new Event('input',{bubbles:true}));
    await new Promise(r=>setTimeout(r,150));
    const click1=()=>{ const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('저장 후')); if(b) b.click(); };
    const closeModal=()=>{ const c=document.querySelector('.modal .icon-btn'); if(c) c.click(); };
    click1(); await new Promise(r=>setTimeout(r,400)); closeModal(); await new Promise(r=>setTimeout(r,200));
    click1(); await new Promise(r=>setTimeout(r,400)); closeModal(); await new Promise(r=>setTimeout(r,200));
    const s=window.Store.state;
    return { txCount: s.transactions.length, due: window.findCustomer(1).due, total: s.transactions[0] && s.transactions[0].total };
  })()`);
  console.log('R ' + JSON.stringify(res));
  exitCode = (res.txCount === 1 && res.due === res.total && res.total === 19000) ? 0 : 1;
  console.log(exitCode===0?'PASS':'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
