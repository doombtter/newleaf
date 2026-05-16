// Measure invoice-page rendered height to confirm it fits on one A4 page
const { app, BrowserWindow } = require('electron');
require('../main.js');
let exitCode = 1;

app.whenReady().then(async () => {
  await new Promise(r => setTimeout(r, 1500));
  const win = BrowserWindow.getAllWindows()[0];
  await new Promise(r => setTimeout(r, 5000));

  const result = await win.webContents.executeJavaScript(`(async ()=>{
    const root = document.getElementById('app')._reactRootContainer;
    // Render an InvoiceModal directly with 50 line items
    const lines = Array.from({length:50}).map((_,i)=>({ itemId:1, itemName:'청양고추 · 녹광', spec:'50구', qty:i+1, price:15000 }));
    const data = { customer: window.findCustomer(1), date: window.todayKey(), rows: lines, subtotal: 1000000, vat: 100000, total: 1100000, payment:'cash', memo:'' };
    const host = document.createElement('div');
    document.body.appendChild(host);
    ReactDOM.createRoot(host).render(React.createElement(window.InvoiceModal, { data, onClose:()=>{} }));
    await new Promise(r=>setTimeout(r,800));
    const pages = host.querySelectorAll('.invoice-page');
    const p = pages[0];
    return {
      pageCount: pages.length,
      rowCount: p.querySelectorAll('.invoice-table tbody tr').length,
      heightPx: p.scrollHeight,
      a4Px: 1123
    };
  })()`);
  console.log('INVOICE CHECK:', JSON.stringify(result));
  // one page, 50 rows, height should be <= ~A4 (allow small slack)
  exitCode = (result.pageCount === 1 && result.rowCount === 50 && result.heightPx <= 1180) ? 0 : 1;
  if (exitCode) console.log('  -> FAIL: invoice does not fit one A4 page');
  app.quit();
});
app.on('window-all-closed', () => process.exit(exitCode));
