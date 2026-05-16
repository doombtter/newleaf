// 재고/품목 관리
const InventoryScreen = () => {
  const state = window.Store.state;
  const [filter, setFilter] = React.useState('all');
  const [editing, setEditing] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [presetOpen, setPresetOpen] = React.useState(false);
  const [, force] = React.useReducer(x => x + 1, 0);

  let items = state.items;
  if (filter === 'low') items = items.filter(i => i.stock < i.safety);
  if (filter === 'good') items = items.filter(i => i.stock >= i.safety);

  const handleSave = async (form) => {
    if (creating) {
      const id = state.nextItemId || (Math.max(...state.items.map(x => x.id)) + 1);
      state.nextItemId = id + 1;
      state.items.push({ ...form, id, initials: window.getInitials(form.name), useCount: 0 });
    } else {
      Object.assign(editing, form, { initials: window.getInitials(form.name) });
    }
    await window.Store.commit();
    setEditing(null);
    setCreating(false);
    force();
  };

  const blank = () => ({ name: '', variety: '', tray: 50, spec: '50구', unit: 'tray', price: 15000, stock: 0, safety: 10, growing: 40, memo: '' });

  return (
    <div className="col" style={{gap:18}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14}}>
        <div className="stat">
          <div className="label">총 품목 수</div>
          <div className="value">{state.items.length}<span style={{fontSize:14, color:'var(--ink-muted)', marginLeft:6, fontFamily:'inherit'}}>종</span></div>
        </div>
        <div className="stat">
          <div className="label">재고 총량</div>
          <div className="value">{state.items.reduce((a, i) => a + (i.stock || 0), 0)}<span style={{fontSize:14, color:'var(--ink-muted)', marginLeft:6, fontFamily:'inherit'}}>트레이</span></div>
        </div>
        <div className="stat danger">
          <div className="label">안전재고 미달</div>
          <div className="value">{state.items.filter(i => i.stock < i.safety).length}<span style={{fontSize:14, color:'var(--ink-muted)', marginLeft:6, fontFamily:'inherit'}}>종</span></div>
          <div className="delta" style={{color:'var(--danger)'}}>즉시 파종 검토</div>
        </div>
        <div className="stat">
          <div className="label">진행 중 파종 (출하 예정)</div>
          <div className="value">{state.sowings.filter(s => s.status !== 'shipped').reduce((a, s) => a + (s.trays || 0), 0)}<span style={{fontSize:14, color:'var(--ink-muted)', marginLeft:6, fontFamily:'inherit'}}>트레이</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="row" style={{gap:14}}>
            <h2>품목 마스터 / 재고 현황</h2>
            <div className="seg">
              <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>전체</button>
              <button className={filter === 'low' ? 'on' : ''} onClick={() => setFilter('low')}>안전재고 미달</button>
              <button className={filter === 'good' ? 'on' : ''} onClick={() => setFilter('good')}>정상</button>
            </div>
          </div>
          <div className="row" style={{gap:8}}>
            <button className="btn btn-sm" onClick={() => setPresetOpen(true)}><Icons.Settings size={14}/> 추천 공수 편집</button>
            <button className="btn btn-sm btn-primary" onClick={() => { setCreating(true); setEditing(blank()); }}><Icons.Plus size={14}/> 신규 품목</button>
          </div>
        </div>
        <div className="card-body tight">
          <table className="tx">
            <thead><tr>
              <th>품목</th>
              <th style={{width:80}}>품종</th>
              <th style={{width:70}}>규격</th>
              <th className="num" style={{width:100}}>기본단가</th>
              <th style={{width:200}}>현재 재고 / 안전재고</th>
              <th className="num" style={{width:80}}>육묘일</th>
              <th className="num" style={{width:80}}>판매빈도</th>
              <th style={{width:80}}>상태</th>
              <th style={{width:80}}></th>
            </tr></thead>
            <tbody>
              {items.map(it => {
                const ratio = it.stock / Math.max(1, it.safety * 2);
                const cls = it.stock < it.safety ? 'danger' : it.stock < it.safety * 1.5 ? 'warn' : '';
                return (
                  <tr key={it.id}>
                    <td><b>{it.name}</b></td>
                    <td>{it.variety || '—'}</td>
                    <td>{it.spec}</td>
                    <td className="num">{window.fmt(it.price)}원</td>
                    <td>
                      <div className="row" style={{justifyContent:'space-between', marginBottom:4, fontSize:12}}>
                        <b className="mono">{it.stock} 트레이</b>
                        <span className="muted mono">안전 {it.safety}</span>
                      </div>
                      <div className="stock-bar">
                        <div className={'fill ' + cls} style={{width: Math.min(100, ratio * 100) + '%'}}/>
                      </div>
                    </td>
                    <td className="num">{it.growing}일</td>
                    <td className="num">{it.useCount || 0}회</td>
                    <td>
                      {it.stock < it.safety
                        ? <span className="tag tag-danger">미달</span>
                        : it.stock < it.safety * 1.5
                          ? <span className="tag tag-warn">부족</span>
                          : <span className="tag tag-green">정상</span>}
                    </td>
                    <td><button className="btn btn-sm btn-ghost" onClick={() => { setEditing(it); setCreating(false); }}>수정</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <ItemEditModal item={editing} creating={creating} onSave={handleSave} onClose={() => { setEditing(null); setCreating(false); }}/>}
      {presetOpen && <TrayPresetModal onClose={() => setPresetOpen(false)} onSaved={force}/>}
    </div>
  );
};

const ItemEditModal = ({ item, creating, onSave, onClose }) => {
  const [form, setForm] = React.useState({ ...item });
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h3><Icons.Box size={16}/> &nbsp; {creating ? '신규 품목 등록' : '품목 정보 수정'}</h3>
          <button className="icon-btn" onClick={onClose}><Icons.X size={18}/></button>
        </div>
        <div style={{padding:24, background:'#fff', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <div className="field" style={{gridColumn:'span 2'}}><label>품목명</label><input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/></div>
          <div className="field"><label>품종</label><input className="input" value={form.variety||''} onChange={e=>setForm({...form, variety:e.target.value})}/></div>
          <div className="field"><label>규격</label><input className="input" value={form.spec||''} onChange={e=>setForm({...form, spec:e.target.value})}/></div>
          <div className="field"><label>트레이 공수 (직접 입력)</label>
            <input className="input mono" type="number" min="1" list="tray-presets"
              value={form.tray||''}
              onChange={e=>{
                const n = Number(e.target.value) || 0;
                setForm({...form, tray:n, spec: n ? n+'구' : ''});
              }}
              placeholder="예: 50"/>
            <datalist id="tray-presets">
              {window.getTrayPresets().map(n => <option key={n} value={n}/>)}
            </datalist>
          </div>
          <div className="field"><label>기본 단가 (원)</label><input className="input mono" value={form.price||0} onChange={e=>setForm({...form, price:Number(e.target.value)||0})}/></div>
          <div className="field"><label>현재 재고 (트레이)</label><input className="input mono" value={form.stock||0} onChange={e=>setForm({...form, stock:Number(e.target.value)||0})}/></div>
          <div className="field"><label>안전 재고 (트레이)</label><input className="input mono" value={form.safety||0} onChange={e=>setForm({...form, safety:Number(e.target.value)||0})}/></div>
          <div className="field"><label>육묘 기간 (일)</label><input className="input mono" value={form.growing||0} onChange={e=>setForm({...form, growing:Number(e.target.value)||0})}/></div>
          <div className="field" style={{gridColumn:'span 2'}}><label>비고</label><input className="input" value={form.memo||''} onChange={e=>setForm({...form, memo:e.target.value})}/></div>
        </div>
        <div className="row" style={{justifyContent:'flex-end', gap:8, padding:16, background:'#FBF8F0', borderTop:'1px solid var(--line)'}}>
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={()=>onSave(form)}><Icons.Save size={16}/> 저장</button>
        </div>
      </div>
    </div>
  );
};

const TrayPresetModal = ({ onClose, onSaved }) => {
  const [list, setList] = React.useState(() => window.getTrayPresets().slice());
  const [val, setVal] = React.useState('');

  const add = () => {
    const n = Number(val);
    if (!n || n < 1) return;
    if (list.includes(n)) { setVal(''); return; }
    setList([...list, n].sort((a, b) => a - b));
    setVal('');
  };
  const remove = (n) => setList(list.filter(x => x !== n));
  const reset = () => setList(window.DEFAULT_TRAY_PRESETS.slice());

  const save = async () => {
    window.Store.state.trayPresets = list.slice().sort((a, b) => a - b);
    await window.Store.commit();
    onSaved && onSaved();
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{maxWidth:460}} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3><Icons.Settings size={16}/> &nbsp; 추천 트레이 공수 편집</h3>
          <button className="icon-btn" onClick={onClose}><Icons.X size={18}/></button>
        </div>
        <div style={{padding:24, background:'#fff'}}>
          <div className="muted" style={{fontSize:13, marginBottom:14}}>
            품목 등록·파종 등록 시 입력칸에 추천으로 뜨는 공수 목록입니다.
          </div>
          <div className="row" style={{gap:8, marginBottom:16}}>
            <input className="input mono" type="number" min="1" value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') add(); }}
              placeholder="공수 입력 후 추가" style={{flex:1}}/>
            <button className="btn btn-primary" onClick={add}><Icons.Plus size={16}/> 추가</button>
          </div>
          <div className="row" style={{flexWrap:'wrap', gap:8, minHeight:40}}>
            {list.length === 0 && <span className="muted" style={{fontSize:13}}>목록이 비어 있습니다.</span>}
            {list.map(n => (
              <span key={n} className="tag tag-neutral" style={{fontSize:14, padding:'8px 10px'}}>
                {n}구
                <button className="icon-btn" style={{width:20, height:20, color:'var(--ink-soft)'}} onClick={() => remove(n)} title="삭제">
                  <Icons.X size={14}/>
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="row" style={{justifyContent:'space-between', gap:8, padding:16, background:'#FBF8F0', borderTop:'1px solid var(--line)'}}>
          <button className="btn" onClick={reset}>기본값 복원</button>
          <div className="row" style={{gap:8}}>
            <button className="btn" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={save}><Icons.Save size={16}/> 저장</button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.InventoryScreen = InventoryScreen;
