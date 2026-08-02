// Electron 主进程 —— 加载打包进来的静态 app/，不开任何 Node 能力
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const SMOKE = process.argv.includes('--smoke');   // 冒烟模式：不显窗，加载成功打印 SMOKE_OK 后退出
let pageErrors = 0;

function createWindow() {
  const win = new BrowserWindow({
    width: 1680,
    height: 980,
    minWidth: 1080,
    minHeight: 680,
    show: !SMOKE,
    backgroundColor: '#0d0a07',
    title: '旅客旅程学习模拟器 · Passenger Journey Simulator',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.setMenuBarVisibility(false);                 // Windows 下隐藏默认菜单栏

  // 页面内的 http(s) 链接一律交给系统浏览器（如「← 返回主页」指向 opcstudio.cc）
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (/^https?:/i.test(url)) { e.preventDefault(); shell.openExternal(url); }
  });

  if (SMOKE) {
    win.webContents.on('console-message', (_e, level, message) => {
      if (level >= 3) { pageErrors++; console.error('[page-error]', message); }
    });
    win.webContents.on('did-finish-load', () => {
      // 给 ES module 一点执行时间，把启动期的报错也收进来
      setTimeout(() => {
        console.log(pageErrors === 0 ? 'SMOKE_OK' : `SMOKE_FAIL errors=${pageErrors}`);
        app.exit(pageErrors === 0 ? 0 : 1);
      }, 2500);
    });
    win.webContents.on('did-fail-load', (_e, code, desc) => {
      console.error('SMOKE_FAIL load', code, desc);
      app.exit(1);
    });
  }

  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
