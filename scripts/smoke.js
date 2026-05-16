// Headless smoke test — launches the renderer and reports console errors
const { app, BrowserWindow } = require('electron');
const path = require('path');

let exitCode = 1;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  let sawError = false;
  win.webContents.on('console-message', (_e, level, msg, line, src) => {
    const tag = ['LOG', 'WARN', 'ERROR', 'INFO'][level] || String(level);
    console.log(`[renderer ${tag}]`, msg, src ? `(${src}:${line})` : '');
    if (level === 2 || level === 3) sawError = true;
  });
  win.webContents.on('render-process-gone', (_e, d) => {
    console.error('renderer crashed:', d);
    sawError = true;
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'index.html'));

  // give Babel time to finish compiling all sources
  await new Promise(r => setTimeout(r, 5000));

  const text = await win.webContents.executeJavaScript(`document.querySelector('.sidebar .brand-text b')?.textContent || document.getElementById('app').textContent.slice(0, 200)`);
  console.log('app content sample:', JSON.stringify(text));

  const hasSidebar = await win.webContents.executeJavaScript(`!!document.querySelector('.sidebar')`);
  console.log('hasSidebar:', hasSidebar);

  exitCode = (hasSidebar && !sawError) ? 0 : 1;
  app.quit();
});

app.on('window-all-closed', () => {
  process.exit(exitCode);
});
