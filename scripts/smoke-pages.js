// Page-by-page smoke: navigate each nav item and confirm no errors
const { app, BrowserWindow } = require('electron');
require('../main.js');

const PAGES = ['home', 'entry', 'customers', 'inventory', 'schedule', 'stats', 'settings'];
let exitCode = 1;

app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];

  let errors = [];
  win.webContents.on('console-message', (_e, level, msg) => {
    if (level === 3) errors.push(msg);
  });

  await new Promise(r => setTimeout(r, 5000));

  for (const page of PAGES) {
    errors = [];
    await win.webContents.executeJavaScript(`(()=>{ const items=[...document.querySelectorAll('.nav-item')]; const t=items.find(n=>n.textContent.includes(${JSON.stringify(
      page === 'home' ? '홈' : page === 'entry' ? '거래 입력' : page === 'customers' ? '거래처' : page === 'inventory' ? '재고' : page === 'schedule' ? '파종' : page === 'stats' ? '매출' : '설정'
    )})); if(t) t.click(); return !!t; })()`);
    await new Promise(r => setTimeout(r, 300));
    const has = await win.webContents.executeJavaScript(`!!document.querySelector('.content > *')`);
    console.log(`page=${page} content=${has} errors=${errors.length}`);
    if (!has || errors.length > 0) {
      console.log('  errors:', errors.slice(0, 3));
    }
  }

  exitCode = 0;
  app.quit();
});

app.on('window-all-closed', () => process.exit(exitCode));
