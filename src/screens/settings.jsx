// 설정 / 백업
const SettingsScreen = () => {
  const [paths, setPaths] = React.useState(null);
  const [toast, setToast] = React.useState('');

  React.useEffect(() => {
    (async () => { setPaths(await window.Store.paths()); })();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  const handleBackup = async () => {
    const p = await window.Store.backup();
    showToast(p ? '백업 완료: ' + p : '백업은 데스크톱(Electron) 모드에서만 동작합니다.');
  };

  const handleExport = async () => {
    const p = await window.Store.exportJSON(`saeipari_export_${window.todayKey()}.json`);
    if (p) showToast('내보내기 완료');
  };

  const handleReset = async () => {
    if (!confirm('정말로 모든 데이터를 초기화하시겠습니까? (이 작업은 되돌릴 수 없습니다)')) return;
    if (!confirm('한 번 더 확인합니다. 진짜로 초기화할까요?')) return;
    window.Store.state = window.seedFactory();
    window.Store.state.schemaVersion = 1;
    await window.Store.commit();
    location.reload();
  };

  const state = window.Store.state;

  return (
    <div className="col" style={{gap:18}}>
      <div className="card">
        <div className="card-head"><h2>사업장 정보</h2></div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="kv"><span className="k">상호</span><span className="v">{window.BIZ.name}</span></div>
            <div className="kv"><span className="k">대표자</span><span className="v">{window.BIZ.owner}</span></div>
            <div className="kv"><span className="k">사업자등록번호</span><span className="v mono">{window.BIZ.bizNo}</span></div>
            <div className="kv"><span className="k">전화 / 팩스</span><span className="v mono" style={{fontSize:13}}>{window.BIZ.phone} / {window.BIZ.fax}</span></div>
            <div className="kv" style={{gridColumn:'span 2'}}><span className="k">사업장 주소</span><span className="v">{window.BIZ.address}</span></div>
            <div className="kv" style={{gridColumn:'span 2'}}><span className="k">입금 계좌</span><span className="v mono">{window.BIZ.bank}</span></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2>데이터 백업 / 복원</h2></div>
        <div className="card-body" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
          <button className="alert-card" style={{textAlign:'left', cursor:'pointer'}} onClick={handleBackup}>
            <div className="badge"><Icons.Save size={18}/></div>
            <div className="body">
              <h4>지금 백업</h4>
              <p>현재 데이터를 즉시 사본으로 저장합니다 (자동 30일 보관)</p>
            </div>
          </button>
          <button className="alert-card" style={{textAlign:'left', cursor:'pointer'}} onClick={handleExport}>
            <div className="badge"><Icons.Download size={18}/></div>
            <div className="body">
              <h4>USB 내보내기</h4>
              <p>JSON 파일로 저장 — USB·외장하드에 보관</p>
            </div>
          </button>
          <button className="alert-card" style={{textAlign:'left', cursor:'pointer'}} onClick={() => paths && window.saeipari?.paths && alert(`데이터 위치:\n${paths.dataFile}\n\n백업 폴더:\n${paths.backupDir}`)}>
            <div className="badge"><Icons.Folder size={18}/></div>
            <div className="body">
              <h4>데이터 폴더 위치</h4>
              <p className="mono" style={{fontSize:11}}>{paths?.dataFile || '데스크톱 모드에서 사용 가능'}</p>
            </div>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2>데이터 통계</h2></div>
        <div className="card-body">
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14}}>
            <div className="stat"><div className="label">거래처</div><div className="value">{state.customers.length}</div></div>
            <div className="stat"><div className="label">품목</div><div className="value">{state.items.length}</div></div>
            <div className="stat"><div className="label">거래 내역</div><div className="value">{state.transactions.length}</div></div>
            <div className="stat"><div className="label">파종 건</div><div className="value">{state.sowings.length}</div></div>
          </div>
        </div>
      </div>

      <div className="card" style={{borderColor:'var(--danger-soft)'}}>
        <div className="card-head"><h2 style={{color:'var(--danger)'}}>위험 영역</h2></div>
        <div className="card-body">
          <button className="btn btn-danger" onClick={handleReset}><Icons.Trash size={16}/> 모든 데이터 초기화</button>
          <span className="muted" style={{marginLeft:12, fontSize:13}}>시드 데이터로 되돌립니다. 초기화 전 반드시 백업하세요.</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h2>버전 정보</h2></div>
        <div className="card-body">
          <p style={{margin:0}}>새이파리 육묘장 관리 <b>v1.0</b></p>
          <p style={{margin:'6px 0 0', color:'var(--ink-muted)', fontSize:13}}>단일 PC · 오프라인 모드 · 자동 백업 30일 보관</p>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

window.SettingsScreen = SettingsScreen;
