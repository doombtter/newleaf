// Home dashboard
const HomeScreen = ({ onNav }) => {
  const state = window.Store.state;
  const today = window.todayKey();
  const tomorrow = (() => {
    const [y,m,d] = today.split('.').map(Number);
    const dt = new Date(y, m-1, d); dt.setDate(dt.getDate()+1);
    return `${dt.getFullYear()}.${String(dt.getMonth()+1).padStart(2,'0')}.${String(dt.getDate()).padStart(2,'0')}`;
  })();
  const upcomingShipments = state.sowings.filter(s => s.status !== 'shipped' && (s.shipDate === today || s.shipDate === tomorrow));
  const lowStock = state.items.filter(i => i.stock < i.safety);
  const dueCustomers = state.customers.filter(c => c.due > 0).sort((a,b) => b.due - a.due);
  const totalDue = dueCustomers.reduce((a,c) => a + c.due, 0);
  const recentTx = [...state.transactions].sort((a,b) => b.id - a.id).slice(0, 8);

  const dueSummary = dueCustomers.slice(0, 3)
    .map(c => `${c.name.split(' ')[0]} ${window.fmt(c.due)}원`).join(' · ')
    + (dueCustomers.length > 3 ? ` · 외 ${dueCustomers.length - 3}건` : '');

  return (
    <div className="col" style={{gap:24}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14}}>
        <div className="stat">
          <div className="label">이번 달 매출</div>
          <div className="value">{window.fmt(state.monthlyTotal)}원</div>
          <div className="delta">전년 동월 대비 +12.4%</div>
        </div>
        <div className="stat">
          <div className="label">이번 달 수금</div>
          <div className="value" style={{color:'var(--green-800)'}}>{window.fmt(state.monthlyPaid)}원</div>
          <div className="delta muted">결제완료 {state.transactions.filter(t=>t.method!=='credit').length}건 / 전체 {state.transactions.length}건</div>
        </div>
        <div className="stat warn">
          <div className="label">미수금 잔액</div>
          <div className="value">{window.fmt(totalDue)}원</div>
          <div className="delta" style={{color:'var(--warn)'}}>{dueCustomers.length}개 거래처</div>
        </div>
        <div className="stat">
          <div className="label">진행 중 파종</div>
          <div className="value">{state.sowings.filter(s=>s.status!=='shipped').length}건</div>
          <div className="delta">이번 주 출하 {upcomingShipments.length}건</div>
        </div>
      </div>

      <div className="home-grid">
        <div className="card">
          <div className="card-head">
            <h2>오늘의 알림</h2>
            <span className="muted" style={{fontSize:13}}>{window.todayLabel().label}</span>
          </div>
          <div className="card-body" style={{display:'flex', flexDirection:'column', gap:12}}>
            {upcomingShipments.slice(0, 2).map(s => {
              const it = window.findItem(s.itemId);
              const isToday = s.shipDate === today;
              return (
                <div key={s.id} className="alert-card warn">
                  <div className="badge"><Icons.Sprout size={20}/></div>
                  <div className="body">
                    <h4>{isToday ? '오늘' : '내일'} 출하 예정 — {it?.name} {it?.spec} {s.trays}트레이</h4>
                    <p>파종 D+{window.dateDiff(s.sowDate, s.shipDate)} {s.memo ? `· ${s.memo}` : ''}</p>
                  </div>
                  <button className="btn btn-sm" onClick={()=>onNav('schedule')}>일정 보기</button>
                </div>
              );
            })}
            {lowStock.slice(0, 1).map(it => (
              <div key={'st'+it.id} className="alert-card danger">
                <div className="badge"><Icons.Box size={20}/></div>
                <div className="body">
                  <h4>안전재고 미달 — {it.name} {it.variety && `(${it.variety}, `}{it.spec}{it.variety && ')'}</h4>
                  <p>현재 {it.stock}트레이 / 안전재고 {it.safety}트레이 · 즉시 파종 검토 필요</p>
                </div>
                <button className="btn btn-sm" onClick={()=>onNav('inventory')}>재고 보기</button>
              </div>
            ))}
            {dueCustomers.length > 0 && (
              <div className="alert-card">
                <div className="badge"><Icons.Wallet size={20}/></div>
                <div className="body">
                  <h4>미수금 누적 {dueCustomers.length}개 거래처 · 합계 {window.fmt(totalDue)}원</h4>
                  <p>{dueSummary}</p>
                </div>
                <button className="btn btn-sm" onClick={()=>onNav('customers')}>수금 처리</button>
              </div>
            )}
            {upcomingShipments.length === 0 && lowStock.length === 0 && dueCustomers.length === 0 && (
              <div className="alert-card">
                <div className="badge"><Icons.Check size={20}/></div>
                <div className="body">
                  <h4>오늘 특별한 알림이 없습니다</h4>
                  <p>출하 예정·안전재고 미달·미수금 모두 정상 상태입니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col" style={{gap:14}}>
          <div className="section-title"><h2>빠른 작업</h2></div>
          <div className="tile-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
            <button className="tile primary" onClick={()=>onNav('entry')}>
              <div className="ic"><Icons.Plus size={24}/></div>
              <div>
                <h3>거래 입력</h3>
                <p>새 거래명세서 작성 · Ctrl+N</p>
              </div>
            </button>
            <button className="tile" onClick={()=>onNav('customers')}>
              <div className="ic"><Icons.Users size={24}/></div>
              <div>
                <h3>거래처 관리</h3>
                <p>외상·미수금 현황</p>
              </div>
            </button>
            <button className="tile" onClick={()=>onNav('inventory')}>
              <div className="ic"><Icons.Box size={24}/></div>
              <div>
                <h3>재고 / 품목</h3>
                <p>입출고 이력</p>
              </div>
            </button>
            <button className="tile" onClick={()=>onNav('schedule')}>
              <div className="ic"><Icons.Sprout size={24}/></div>
              <div>
                <h3>파종 / 출하</h3>
                <p>일정 캘린더</p>
              </div>
            </button>
            <button className="tile" onClick={()=>onNav('stats')}>
              <div className="ic"><Icons.Chart size={24}/></div>
              <div>
                <h3>매출 통계</h3>
                <p>엑셀 내보내기</p>
              </div>
            </button>
            <button className="tile" onClick={()=>onNav('settings')}>
              <div className="ic"><Icons.Settings size={24}/></div>
              <div>
                <h3>설정 / 백업</h3>
                <p>USB 데이터 백업</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>최근 거래 내역</h2>
          <button className="btn btn-sm" onClick={()=>onNav('stats')}>전체 보기</button>
        </div>
        <div className="card-body tight">
          <table className="tx">
            <thead><tr>
              <th style={{width:90}}>거래일</th>
              <th>거래처</th>
              <th style={{width:80}}>품목수</th>
              <th className="num" style={{width:140}}>합계</th>
              <th style={{width:100}}>결제</th>
              <th style={{width:60}}></th>
            </tr></thead>
            <tbody>
              {recentTx.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:40, color:'var(--ink-muted)'}}>거래 내역 없음 — 새 거래를 입력해 보세요</td></tr>}
              {recentTx.map(t => {
                const c = window.findCustomer(t.customerId);
                return (
                  <tr key={t.id}>
                    <td className="mono">{t.date}</td>
                    <td><b>{c?.name || '—'}</b> <span className="muted" style={{fontSize:12, marginLeft:6}}>#{t.id}</span></td>
                    <td>{t.items}건</td>
                    <td className="num"><b>{window.fmt(t.total)}원</b></td>
                    <td>
                      {t.method === 'cash' && <span className="tag tag-green">현금</span>}
                      {t.method === 'transfer' && <span className="tag tag-green">이체</span>}
                      {t.method === 'credit' && <span className="tag tag-warn">외상</span>}
                    </td>
                    <td><button className="btn btn-sm btn-ghost" title="재인쇄"><Icons.Print size={16}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

window.HomeScreen = HomeScreen;
