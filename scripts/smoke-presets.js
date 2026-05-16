// 추천 공수 편집: 모달 열기 → 값 추가 → 저장 → 재기동 후 유지 검증
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;

app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 5000));

  const before = await win.webContents.executeJavaScript(`(()=>{
    const nav=[...document.querySelectorAll('.nav-item')].find(n=>n.textContent.includes('재고'));
    nav && nav.click();
    return JSON.stringify(window.getTrayPresets());
  })()`);
  await new Promise(r => setTimeout(r, 300));

  // open preset modal, programmatically set state + save via Store (simulating UI save)
  const saved = await win.webContents.executeJavaScript(`(async ()=>{
    const btn=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('추천 공수 편집'));
    if(!btn) return 'no-button';
    btn.click();
    await new Promise(r=>setTimeout(r,200));
    const modal=document.querySelector('.modal-head')?.textContent || '';
    // simulate add+save through store
    window.Store.state.trayPresets=[50,77,128];
    await window.Store.commit();
    return modal.includes('추천 트레이 공수 편집') ? 'modal-ok' : 'modal-missing';
  })()`);

  await win.webContents.reload();
  await new Promise(r => setTimeout(r, 5000));
  const after = await win.webContents.executeJavaScript(`JSON.stringify(window.getTrayPresets())`);

  console.log('before:', before, 'modal:', saved, 'after-reload:', after);
  exitCode = (saved === 'modal-ok' && after === '[50,77,128]') ? 0 : 1;
  console.log(exitCode === 0 ? 'PASS' : 'FAIL');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
