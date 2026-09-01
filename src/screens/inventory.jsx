// 품목 관리 (단가1·2·3)
const InventoryScreen = () => {
  const state = window.Store.state;
  const [editing, setEditing] = React.useState(null);
  const [creating, setCreating] = React.useState(false);
  const [presetOpen, setPresetOpen] = React.useState(false);
  const [, force] = React.useReducer(x => x + 1, 0);

  const items = state.items;

  const handleSave = async (form) => {
    if (creating) {
      const id = state.nextItemId || (Math.max(0, ...state.items.map(x => x.id)) + 1);
      state.nextItemId = id + 1;
      state.items.push({ ...form, id, initials: window.getInitials(form.name), useCount: 0, stock: 0, safety: 0, growing: 0 });
    } else {
      Object.assign(editing, form, { initials: window.getInitials(form.name) });
    }
    await window.Store.commit();
    setEditing(null);
    setCreating(false);
    force();
  };

  const handleDelete = async (it) => {
    if (!confirm(`'${it.name}${it.variety ? ' · ' + it.variety : ''} (${it.spec})' 품목을 삭제하시겠습니까?\n과거 거래 내역의 품목명은 그대로 보존됩니다.`)) return;
    window.removeItem(it.id);
    await window.Store.commit();
    force();
  };

  const blank = () => ({ name: '', variety: '', tray: 50, spec: '50구', unit: 'tray', price1: 15000, price2: 15000, price3: 15000, useBox: true, memo: '' });

  return (
    <div className="col" style={{gap:18}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14}}>
        <div className="stat">
          <div className="label">총 품목 수</div>
          <div className="value">{state.items.length}<span style={{fontSize:14, color:'var(--ink-muted)', marginLeft:6, fontFamily:'inherit'}}>종</span></div>
        </div>
        <div className="stat">
          <div className="label">거래처 수</div>
          <div className="value">{state.customers.length}<span style={{fontSize:14, color:'var(--ink-muted)', marginLeft:6, fontFamily:'inherit'}}>곳</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>품목 / 단가 관리</h2>
          <div className="row" style={{gap:8}}>
            <button className="btn btn-sm" onClick={() => setPresetOpen(true)}><Icons.Settings size={14}/> 추천 공수 편집</button>
            <button className="btn btn-sm btn-primary" onClick={() => { setCreating(true); setEditing(blank()); }}><Icons.Plus size={14}/> 신규 품목</button>
          </div>
        </div>
        <div className="card-body tight">
          <table className="tx">
            <thead><tr>
              <th>품목</th>
              <th style={{width:100}}>품종</th>
              <th style={{width:80}}>규격</th>
              <th className="num" style={{width:110}}>단가1</th>
              <th className="num" style={{width:110}}>단가2</th>
              <th className="num" style={{width:110}}>단가3</th>
              <th style={{width:70}}>상자</th>
              <th style={{width:110}}></th>
            </tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan="8" style={{textAlign:'center', padding:40, color:'var(--ink-muted)'}}>등록된 품목이 없습니다. "신규 품목"으로 추가하세요.</td></tr>}
              {items.map(it => (
                <tr key={it.id}>
                  <td><b>{it.name}</b></td>
                  <td>{it.variety || '—'}</td>
                  <td>{it.spec}</td>
                  <td className="num">{window.fmt(window.itemLevelPrice(it, 1))}원</td>
                  <td className="num">{window.fmt(window.itemLevelPrice(it, 2))}원</td>
                  <td className="num">{window.fmt(window.itemLevelPrice(it, 3))}원</td>
                  <td>
                    {window.itemUsesBox(it)
                      ? <span className="tag tag-green">O</span>
                      : <span className="tag tag-neutral">X</span>}
                  </td>
                  <td>
                    <div className="row" style={{gap:4}}>
                      <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(it); setCreating(false); }}>수정</button>
                      <button className="btn btn-sm btn-ghost" style={{color:'var(--danger)'}} onClick={() => handleDelete(it)} title="삭제"><Icons.Trash size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
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
  const submit = () => {
    if (!form.name || !form.name.trim()) { alert('품목명을 입력해 주세요.'); return; }
    onSave(form);
  };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}
        onKeyDown={e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); submit(); } }}>
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
          <div className="field"><label>단가1 (원)</label><input className="input mono" value={form.price1 ?? form.price ?? 0} onChange={e=>setForm({...form, price1:Number(e.target.value)||0})}/></div>
          <div className="field"><label>단가2 (원)</label><input className="input mono" value={form.price2 ?? form.price ?? 0} onChange={e=>setForm({...form, price2:Number(e.target.value)||0})}/></div>
          <div className="field"><label>단가3 (원)</label><input className="input mono" value={form.price3 ?? form.price ?? 0} onChange={e=>setForm({...form, price3:Number(e.target.value)||0})}/></div>
          <div className="field"><label>상자 사용 (상자수 자동합계 포함)</label>
            <div className="seg" style={{width:'100%'}}>
              <button className={window.itemUsesBox(form) ? 'on' : ''} style={{flex:1}} onClick={()=>setForm({...form, useBox:true})}>O (사용)</button>
              <button className={!window.itemUsesBox(form) ? 'on' : ''} style={{flex:1}} onClick={()=>setForm({...form, useBox:false})}>X (미사용)</button>
            </div>
          </div>
          <div className="field" style={{gridColumn:'span 2'}}><label>비고</label><input className="input" value={form.memo||''} onChange={e=>setForm({...form, memo:e.target.value})}/></div>
        </div>
        <div className="row" style={{justifyContent:'flex-end', gap:8, padding:16, background:'#FBF8F0', borderTop:'1px solid var(--line)'}}>
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={submit}><Icons.Save size={16}/> 저장</button>
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
