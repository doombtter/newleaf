// 파종/출하 일정
const ScheduleScreen = () => {
  const state = window.Store.state;
  const [view, setView] = React.useState('cal');
  const [cursor, setCursor] = React.useState(() => { const t = window.todayLabel(); return { y: t.y, m: t.m }; });
  const [creating, setCreating] = React.useState(false);
  const [, force] = React.useReducer(x => x + 1, 0);

  const today = window.todayLabel();
  const isCurrentMonth = cursor.y === today.y && cursor.m === today.m;
  const monthStart = new Date(cursor.y, cursor.m - 1, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m, 0).getDate();
  const cells = [];
  for (let i = 0; i < monthStart; i++) cells.push({ dim: true, d: '' });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d });
  while (cells.length % 7 !== 0) cells.push({ dim: true, d: '' });

  const shipMap = {};
  const sowMap = {};
  state.sowings.forEach(s => {
    const [sy, sm, sd] = s.shipDate.split('.').map(Number);
    if (sy === cursor.y && sm === cursor.m) (shipMap[sd] = shipMap[sd] || []).push(s);
    const [py, pm, pd] = s.sowDate.split('.').map(Number);
    if (py === cursor.y && pm === cursor.m) (sowMap[pd] = sowMap[pd] || []).push(s);
  });

  const navMonth = (delta) => {
    let m = cursor.m + delta, y = cursor.y;
    if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
    setCursor({ y, m });
  };

  const handleCreate = async (form) => {
    const id = state.nextSowingId || (Math.max(0, ...state.sowings.map(s => s.id)) + 1);
    state.nextSowingId = id + 1;
    const ship = window.computeShipDate(form.sowDate, form.growing);
    state.sowings.push({
      id,
      itemId: form.itemId,
      sowDate: form.sowDate,
      shipDate: ship,
      trays: form.trays,
      traySize: form.traySize,
      status: 'sowing',
      memo: form.memo || '',
    });
    await window.Store.commit();
    setCreating(false);
    force();
  };

  const sortedList = [...state.sowings].sort((a, b) => a.shipDate.localeCompare(b.shipDate));

  return (
    <div className="col" style={{gap:18}}>
      <div className="card">
        <div className="card-head">
          <div className="row" style={{gap:14}}>
            <button className="btn btn-sm" onClick={() => navMonth(-1)}><Icons.ChevronLeft size={14}/></button>
            <h2 style={{minWidth:120}}>{cursor.y}년 {cursor.m}월</h2>
            <button className="btn btn-sm" onClick={() => navMonth(1)}><Icons.ChevronRight size={14}/></button>
            <button className="btn btn-sm" onClick={() => setCursor({ y: today.y, m: today.m })}>오늘</button>
          </div>
          <div className="row" style={{gap:10}}>
            <div className="seg">
              <button className={view === 'cal' ? 'on' : ''} onClick={() => setView('cal')}>캘린더</button>
              <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}>리스트</button>
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => setCreating(true)}><Icons.Plus size={14}/> 파종 등록</button>
          </div>
        </div>

        {view === 'cal' && (
          <div className="card-body tight">
            <div className="cal-grid">
              {['일','월','화','수','목','금','토'].map(d => <div key={d} className="cal-head">{d}</div>)}
              {cells.map((c, i) => {
                const isToday = !c.dim && isCurrentMonth && c.d === today.d;
                const ships = !c.dim ? (shipMap[c.d] || []) : [];
                const sows = !c.dim ? (sowMap[c.d] || []) : [];
                const isSun = i % 7 === 0;
                return (
                  <div key={i} className={'cal-cell' + (c.dim ? ' dim' : '') + (isToday ? ' today' : '')}>
                    <div className={'d' + (isSun ? ' sun' : '')}>{c.d}{isToday && <span style={{marginLeft:6, fontSize:11, color:'var(--green-800)', fontWeight:700}}>오늘</span>}</div>
                    {ships.map(s => {
                      const it = window.findItem(s.itemId);
                      const days = isCurrentMonth ? (c.d - today.d) : 999;
                      const cls = days <= 1 && days >= 0 ? 'danger' : days <= 3 && days >= 0 ? 'warn' : '';
                      return <div key={'sh' + s.id} className={'cal-pill ' + cls} title={`${it?.name} ${s.trays}T 출하`}>🚚 {it?.name} {s.trays}T</div>;
                    })}
                    {sows.map(s => {
                      const it = window.findItem(s.itemId);
                      return <div key={'so' + s.id} className="cal-pill" style={{background:'#E8F0FA', color:'#1D4F8A'}} title={`${it?.name} 파종`}>🌱 {it?.name} 파종</div>;
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="card-body tight">
            <table className="tx">
              <thead><tr>
                <th style={{width:90}}>출하 예정일</th>
                <th style={{width:60}}>D-day</th>
                <th>품목</th>
                <th style={{width:80}}>규격</th>
                <th className="num" style={{width:80}}>트레이</th>
                <th style={{width:90}}>파종일</th>
                <th style={{width:90}}>경과</th>
                <th style={{width:100}}>상태</th>
              </tr></thead>
              <tbody>
                {sortedList.map(s => {
                  const it = window.findItem(s.itemId);
                  const dday = window.daysBetween(s.shipDate);
                  const elapsed = window.dateDiff(s.sowDate, window.todayKey());
                  return (
                    <tr key={s.id}>
                      <td className="mono"><b>{s.shipDate}</b></td>
                      <td><span className={'tag ' + (dday <= 1 ? 'tag-danger' : dday <= 3 ? 'tag-warn' : 'tag-neutral')}>{dday <= 0 ? 'D-day' : `D-${dday}`}</span></td>
                      <td><b>{it?.name}</b> {it?.variety && <span className="muted">· {it.variety}</span>}</td>
                      <td>{s.traySize}구</td>
                      <td className="num"><b>{s.trays}</b></td>
                      <td className="mono">{s.sowDate}</td>
                      <td>{elapsed}일째</td>
                      <td>
                        {s.status === 'sowing' && <span className="tag tag-neutral">파종</span>}
                        {s.status === 'germinating' && <span className="tag tag-neutral">발아중</span>}
                        {s.status === 'growing' && <span className="tag tag-green">육묘중</span>}
                        {s.status === 'shipped' && <span className="tag tag-neutral">출하완료</span>}
                      </td>
                    </tr>
                  );
                })}
                {sortedList.length === 0 && <tr><td colSpan="8" style={{textAlign:'center', padding:40, color:'var(--ink-muted)'}}>등록된 파종 건이 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && <SowingCreateModal onClose={() => setCreating(false)} onSave={handleCreate}/>}
    </div>
  );
};

const SowingCreateModal = ({ onClose, onSave }) => {
  const state = window.Store.state;
  const [form, setForm] = React.useState({
    itemId: state.items[0]?.id || 1,
    sowDate: window.todayKey(),
    trays: 10,
    traySize: state.items[0]?.tray || 50,
    growing: state.items[0]?.growing || 40,
    memo: '',
  });
  const setItem = (id) => {
    const it = window.findItem(Number(id));
    setForm({ ...form, itemId: Number(id), traySize: it?.tray || 50, growing: it?.growing || 40 });
  };
  const expectedShip = window.computeShipDate(form.sowDate, form.growing);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h3><Icons.Sprout size={16}/> &nbsp; 새 파종 등록</h3>
          <button className="icon-btn" onClick={onClose}><Icons.X size={18}/></button>
        </div>
        <div style={{padding:24, background:'#fff', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <div className="field" style={{gridColumn:'span 2'}}>
            <label>품목</label>
            <select className="select" value={form.itemId} onChange={e=>setItem(e.target.value)}>
              {state.items.map(it => <option key={it.id} value={it.id}>{it.name} {it.variety && `· ${it.variety}`} ({it.spec})</option>)}
            </select>
          </div>
          <div className="field"><label>파종일</label><input className="input mono" value={form.sowDate} onChange={e=>setForm({...form, sowDate:e.target.value})} placeholder="YYYY.MM.DD"/></div>
          <div className="field"><label>육묘 기간 (일)</label><input className="input mono" value={form.growing} onChange={e=>setForm({...form, growing:Number(e.target.value)||0})}/></div>
          <div className="field"><label>트레이 수</label><input className="input mono" value={form.trays} onChange={e=>setForm({...form, trays:Number(e.target.value)||0})}/></div>
          <div className="field"><label>트레이 규격 (공)</label>
            <select className="select" value={form.traySize} onChange={e=>setForm({...form, traySize:Number(e.target.value)})}>
              {[50,72,105,128,200].map(n => <option key={n} value={n}>{n}공</option>)}
            </select>
          </div>
          <div className="field" style={{gridColumn:'span 2'}}><label>비고</label><input className="input" value={form.memo} onChange={e=>setForm({...form, memo:e.target.value})}/></div>
          <div className="kv" style={{gridColumn:'span 2', background:'var(--green-50)'}}>
            <span className="k">출하 예정일 (자동 계산)</span>
            <span className="v mono" style={{color:'var(--green-800)', fontSize:18}}>{expectedShip}</span>
          </div>
        </div>
        <div className="row" style={{justifyContent:'flex-end', gap:8, padding:16, background:'#FBF8F0', borderTop:'1px solid var(--line)'}}>
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={()=>onSave(form)}><Icons.Save size={16}/> 등록</button>
        </div>
      </div>
    </div>
  );
};

window.ScheduleScreen = ScheduleScreen;
