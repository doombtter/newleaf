// Full smoke test using main.js — boot the real app, verify renderer, then quit
const { app, BrowserWindow } = require('electron');

let exitCode = 1;
let sawError = false;

const realMain = require('../main.js');

app.whenReady().then(async () => {
  // wait for main window to be created by main.js
  await new Promise(r => setTimeout(r, 1500));
  const wins = BrowserWindow.getAllWindows();
  if (wins.length === 0) {
    console.error('main window not created');
    return app.quit();
  }
  const win = wins[0];
  win.webContents.on('console-message', (_e, level, msg, line, src) => {
    const tag = ['LOG', 'WARN', 'ERROR', 'INFO'][level] || level;
    console.log(`[renderer ${tag}]`, msg, src ? `(${src}:${line})` : '');
    if (level === 3) sawError = true;
  });

  await new Promise(r => setTimeout(r, 5000));

  const result = await win.webContents.executeJavaScript(`(()=>({
    hasSidebar: !!document.querySelector('.sidebar'),
    brand: document.querySelector('.brand-text b')?.textContent,
    pageTitle: document.querySelector('.topbar h1')?.textContent,
    customerCount: window.Store?.state?.customers?.length || 0,
    itemCount: window.Store?.state?.items?.length || 0,
    isElectron: !!window.IS_ELECTRON,
    pathInfo: typeof window.saeipari?.paths === 'function'
  }))()`);
  console.log('SMOKE RESULT:', JSON.stringify(result, null, 2));

  exitCode = (result.hasSidebar && result.customerCount > 0 && result.itemCount > 0 && !sawError) ? 0 : 1;
  app.quit();
});

app.on('window-all-closed', () => {
  process.exit(exitCode);
});
