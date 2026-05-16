// 메인 앱 셸
const NAV = [
  { id: 'home', label: '홈', icon: Icons.Home },
  { id: 'entry', label: '거래 입력', icon: Icons.Plus },
  { id: 'customers', label: '거래처', icon: Icons.Users },
  { id: 'inventory', label: '재고/품목', icon: Icons.Box },
  { id: 'schedule', label: '파종/출하', icon: Icons.Sprout },
  { id: 'stats', label: '매출 통계', icon: Icons.Chart },
  { id: 'settings', label: '설정 / 백업', icon: Icons.Settings },
];

const TITLES = {
  home: '홈',
  entry: '거래 입력',
  customers: '거래처 관리',
  inventory: '재고 / 품목 관리',
  schedule: '파종 / 출하 일정',
  stats: '매출 통계',
  settings: '설정 / 백업',
};

const App = () => {
  const [page, setPage] = React.useState('home');
  const [invoice, setInvoice] = React.useState(null);
  const [entryKey, setEntryKey] = React.useState(0);
  const [editTx, setEditTx] = React.useState(null);
  const invoiceRef = React.useRef(null);
  const today = window.todayLabel();

  const newEntry = () => { setEditTx(null); setEntryKey(k => k + 1); setPage('entry'); };
  const openEdit = (tx) => { setEditTx(tx); setEntryKey(k => k + 1); setPage('entry'); };
  const reprint = (tx) => setInvoice(window.txToInvoice(tx));
  React.useEffect(() => { invoiceRef.current = invoice; }, [invoice]);

  React.useEffect(() => {
    const doPrint = () => {
      if (invoiceRef.current) { window.print(); }
      else { alert('인쇄는 거래명세서 미리보기에서만 가능합니다.\n거래 입력에서 "저장 후 인쇄"를 누르거나,\n홈·거래처의 거래 목록에서 "재출력"을 선택하세요.'); }
    };
    if (window.saeipari?.onShortcut) {
      window.saeipari.onShortcut((key) => {
        if (key === 'new') newEntry();
        else if (key === 'save') document.dispatchEvent(new CustomEvent('saeipari:save'));
        else if (key === 'print') doPrint();
      });
    }
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); newEntry(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') { e.preventDefault(); doPrint(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); document.dispatchEvent(new CustomEvent('saeipari:save')); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const onSaved = () => { setEditTx(null); setEntryKey(k => k + 1); setPage('home'); };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">새</div>
          <div className="brand-text">
            <b>{window.BIZ.name}</b>
            <span>육묘장 관리</span>
          </div>
        </div>
        {NAV.map(n => {
          const Ic = n.icon;
          return (
            <div key={n.id} className={'nav-item' + (page === n.id ? ' active' : '')} onClick={() => setPage(n.id)}>
              <span className="ic"><Ic size={18}/></span>
              <span>{n.label}</span>
            </div>
          );
        })}
        <div className="footer">
          v1.0 · 단일 PC 오프라인 모드<br/>
          {window.IS_ELECTRON ? '데스크톱 앱' : '브라우저 미리보기'}
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="row" style={{gap:14}}>
            <h1>{TITLES[page]}</h1>
            {page === 'home' && <span className="pill">단일 PC · 오프라인</span>}
          </div>
          <div className="meta">
            <div className="row" style={{gap:6}}><Icons.Calendar size={16}/> {today.label}</div>
            <div className="row" style={{gap:6}}>
              <span style={{fontWeight:600}}>{window.BIZ.owner} 사장님</span>
            </div>
          </div>
        </div>
        <div className="content">
          {page === 'home' && <HomeScreen onNav={setPage} onEditTx={openEdit} onReprint={reprint}/>}
          {page === 'entry' && <EntryScreen key={entryKey} editTx={editTx} onPrint={(d) => setInvoice(d)} onSaved={onSaved} onNav={setPage}/>}
          {page === 'customers' && <CustomersScreen onNav={setPage} onEditTx={openEdit} onReprint={reprint}/>}
          {page === 'inventory' && <InventoryScreen/>}
          {page === 'schedule' && <ScheduleScreen/>}
          {page === 'stats' && <StatsScreen/>}
          {page === 'settings' && <SettingsScreen/>}
        </div>
      </main>

      <InvoiceModal data={invoice} onClose={() => setInvoice(null)}/>
    </div>
  );
};

window.__renderApp = () => {
  ReactDOM.createRoot(document.getElementById('app')).render(<App/>);
};
