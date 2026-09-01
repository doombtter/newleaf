// 품목별 상자 O/X: X 품목 수량은 상자수 자동합계에서 제외 + 품목표 O/X 표시
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;
app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 4000));

  const setup = await win.webContents.executeJavaScript(`(async ()=>{
    window.print=()=>{}; window.confirm=()=>true; window.alert=()=>{};
    const s=window.Store.state;
    s.customers.push({ id:1, name:'A', priceLevel:1, due:0 });
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', spec:'50구', price1:10000, price2:10000, price3:10000, useBox:true,  stock:0,safety:0,growing:0,useCount:0 });
    s.items.push({ id:2, name:'모종판', initials:'ㅁㅈㅍ', spec:'50구', price1:5000, price2:5000, price3:5000, useBox:false, stock:0,safety:0,growing:0,useCount:0 });
    s.items.push({ id:3, name:'구버전', initials:'ㄱㅂㅈ', spec:'50구', price1:1000, stock:0,safety:0,growing:0,useCount:0 }); // useBox 없음 = O
    s.favoriteItems=[1,2]; s.nextItemId=4; s.nextCustomerId=2; await window.Store.commit();
    return { o: window.itemUsesBox(window.findItem(1)), x: window.itemUsesBox(window.findItem(2)), legacy: window.itemUsesBox(window.findItem(3)) };
  })()`);

  const inv = await win.webContents.executeJavaScript(`(async ()=>{
    const nav=[...document.querySelectorAll('.nav-item')].find(n=>n.textContent.includes('재고')); nav&&nav.click();
    await new Promise(r=>setTimeout(r,400));
    const rows=[...document.querySelectorAll('table.tx tbody tr')];
    return rows.slice(0,3).map(tr=>{ const t=[...tr.children].map(td=>td.textContent.trim()); return t[0]+':'+t[6]; });
  })()`);

  const entry = await win.webContents.executeJavaScript(`(async ()=>{
    const nav=[...document.querySelectorAll('.nav-item')].find(n=>n.textContent.includes('거래 입력')); nav&&nav.click();
    await new Promise(r=>setTimeout(r,400));
    const favs=[...document.querySelectorAll('.fav-item')];
    if(favs[0]) favs[0].click(); await new Promise(r=>setTimeout(r,200));  // 고추(O) 수량1
    if(favs[1]) favs[1].click(); await new Promise(r=>setTimeout(r,200));  // 모종판(X) 수량1
    const field=[...document.querySelectorAll('.field')].find(f=>f.textContent.includes('상자 수'));
    const input=field && field.querySelector('input');
    const rowCount=document.querySelectorAll('.row-grid .row-no').length;
    return { boxShown: input ? Number(input.value) : null, rowCount };
  })()`);

  console.log('FLAGS ' + JSON.stringify(setup));
  console.log('INVENTORY ' + JSON.stringify(inv));
  console.log('ENTRY ' + JSON.stringify(entry));
  const flagsOk = setup.o === true && setup.x === false && setup.legacy === true;
  const invOk = inv.some(s => s.startsWith('고추:O')) && inv.some(s => s.startsWith('모종판:X'));
  const boxOk = entry.boxShown === 1;   // O 품목 1개만 카운트(둘 다면 2)
  exitCode = (flagsOk && invOk && boxOk) ? 0 : 1;
  console.log('flags',flagsOk,'inv',invOk,'box',boxOk,'=>',exitCode===0?'PASS':'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
