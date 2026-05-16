const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const USER_DATA = app.getPath('userData');
const DATA_DIR = path.join(USER_DATA, 'data');
const BACKUP_DIR = path.join(USER_DATA, 'backups');
const DATA_FILE = path.join(DATA_DIR, 'saeipari.json');

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function loadData() {
  ensureDirs();
  if (!fs.existsSync(DATA_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return null;
  }
}

function saveData(payload) {
  ensureDirs();
  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
}

function backupNow() {
  ensureDirs();
  if (!fs.existsSync(DATA_FILE)) return null;
  const d = new Date();
  const ymd = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const dest = path.join(BACKUP_DIR, `saeipari_${ymd}.json`);
  fs.copyFileSync(DATA_FILE, dest);
  pruneOldBackups();
  return dest;
}

function pruneOldBackups() {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const name of fs.readdirSync(BACKUP_DIR)) {
    const p = path.join(BACKUP_DIR, name);
    try {
      const st = fs.statSync(p);
      if (st.mtimeMs < cutoff) fs.unlinkSync(p);
    } catch {}
  }
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1680,
    height: 1040,
    minWidth: 1280,
    minHeight: 800,
    show: false,
    backgroundColor: '#F5F0E8',
    title: '새이파리 육묘장 관리',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  const menu = Menu.buildFromTemplate([
    {
      label: '파일',
      submenu: [
        { label: '새 거래 (Ctrl+N)', click: () => mainWindow?.webContents.send('shortcut', 'new') },
        { label: '저장 (Ctrl+S)', click: () => mainWindow?.webContents.send('shortcut', 'save') },
        { label: '거래명세서 인쇄 (Ctrl+P)', click: () => mainWindow?.webContents.send('shortcut', 'print') },
        { type: 'separator' },
        { label: '데이터 폴더 열기', click: () => shell.openPath(USER_DATA) },
        { label: '지금 백업', click: () => { const p = backupNow(); if (p) dialog.showMessageBox(mainWindow, { message: '백업 완료', detail: p }); } },
        { type: 'separator' },
        { role: 'quit', label: '종료' }
      ]
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo', label: '실행 취소' },
        { role: 'redo', label: '다시 실행' },
        { type: 'separator' },
        { role: 'cut', label: '잘라내기' },
        { role: 'copy', label: '복사' },
        { role: 'paste', label: '붙여넣기' },
        { role: 'selectAll', label: '모두 선택' }
      ]
    },
    {
      label: '보기',
      submenu: [
        { role: 'reload', label: '새로 고침' },
        { role: 'toggleDevTools', label: '개발자 도구' },
        { type: 'separator' },
        { role: 'resetZoom', label: '기본 크기' },
        { role: 'zoomIn', label: '확대' },
        { role: 'zoomOut', label: '축소' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '전체화면' }
      ]
    },
    {
      label: '도움말',
      submenu: [
        { label: '버전 정보', click: () => dialog.showMessageBox(mainWindow, {
            title: '새이파리 육묘장 관리',
            message: '새이파리 육묘장 관리 v1.0',
            detail: '단일 PC 오프라인 모드\n사업장: 새이파리 (윤준수)\n주소: 전주시 덕진구 화전동 692-15'
          })
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  ensureDirs();

  ipcMain.handle('data:load', () => loadData());
  ipcMain.handle('data:save', (_e, payload) => { saveData(payload); return true; });
  ipcMain.handle('data:backup', () => backupNow());
  ipcMain.handle('data:export', async (_e, { suggestedName, content }) => {
    const res = await dialog.showSaveDialog(mainWindow, {
      title: '내보내기',
      defaultPath: suggestedName || 'export.json',
      filters: [{ name: 'JSON', extensions: ['json'] }, { name: '모든 파일', extensions: ['*'] }]
    });
    if (res.canceled || !res.filePath) return null;
    fs.writeFileSync(res.filePath, content, 'utf8');
    return res.filePath;
  });
  ipcMain.handle('app:print', () => { mainWindow?.webContents.print({ silent: false, printBackground: true }); });
  ipcMain.handle('app:paths', () => ({ userData: USER_DATA, dataFile: DATA_FILE, backupDir: BACKUP_DIR }));

  createWindow();

  // 자동 백업: 시작 시 1회
  try { backupNow(); } catch {}

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
