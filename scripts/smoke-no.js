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
    s.items.push({ id:1, name:'고추', initials:'ㄱㅊ', variety:'', tray:50, spec:'50구', unit:'tray', price:1000, stock:9, safety:1, growing:1, useCount:0, memo:'' });
    s.nextItemId=2; s.nextCustomerId=2; await window.Store.commit();
    const nav=[...document.querySelectorAll('.nav-item')].find(n=>n.textContent.includes('거래 입력')); nav&&nav.click();
    await new Promise(r=>setTimeout(r,400));
    const head=[...document.querySelectorAll('.row-grid.head div')].map(d=>d.textContent);
    const nos=[...document.querySelectorAll('.row-no')].map(d=>d.textContent);
    const dragHandlerOk = !!document.querySelector('.entry-grid');
    return { head, nos, dragHandlerOk };
  })()`);
  console.log('R ' + JSON.stringify(r));
  exitCode = (r.head[0]==='No.' && r.nos[0]==='1' && r.dragHandlerOk) ? 0 : 1;
  console.log(exitCode===0?'PASS':'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
