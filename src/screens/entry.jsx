// Transaction entry screen with item autocomplete (초성/부분 일치 검색)
const { useState, useMemo, useRef, useEffect } = React;

const ItemAutocomplete = ({ value, onSelect, onChange, autoFocus }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);

  const candidates = useMemo(() => {
    const q = (value || '').trim();
    const items = window.Store.state.items;
    const recent = window.Store.state.recentItems || [];
    if (!q) {
      return recent.map(id => items.find(i => i.id === id)).filter(Boolean).slice(0, 8);
    }
    const qInit = window.getInitials(q);
    const isInitOnly = /^[ㄱ-ㅎ]+$/.test(q);
    const scored = items.map(it => {
      const fullInit = it.initials || window.getInitials(it.name);
      let score = 0;
      if (isInitOnly) {
        if (fullInit.startsWith(qInit)) score = 100;
        else if (fullInit.includes(qInit)) score = 50;
      } else {
        if (it.name.startsWith(q)) score = 100;
        else if (it.name.includes(q)) score = 70;
        else if ((it.variety || '').includes(q)) score = 50;
        else if (fullInit.includes(qInit)) score = 30;
      }
      return { it, score };
    }).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score || (b.it.useCount || 0) - (a.it.useCount || 0))
      .slice(0, 8);
    return scored.map(x => x.it);
  }, [value]);

  useEffect(() => {
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(candidates.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter' && open && candidates[active]) {
      e.preventDefault();
      onSelect(candidates[active]);
      setOpen(false);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="ac-wrap" ref={ref}>
      <input
        className="row-input"
        style={{width:'100%'}}
        value={value}
        autoFocus={autoFocus}
        placeholder="품목 입력 (초성 ㅊㅇㄱㅊ / 부분 '복합')"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
      />
      {open && candidates.length > 0 && (
        <div className="ac-list">
          {!(value || '').trim() && <div className="ac-section">최근 사용한 품목</div>}
          {candidates.map((it, i) => (
            <div key={it.id}
              className={'ac-item' + (i === active ? ' active' : '')}
              onMouseDown={(e) => { e.preventDefault(); onSelect(it); setOpen(false); }}
              onMouseEnter={() => setActive(i)}>
              <div>
                <b>{it.name}</b>
                {it.variety && <span className="muted" style={{marginLeft:6, fontSize:12}}>· {it.variety}</span>}
                <span className="muted" style={{marginLeft:8, fontSize:12}}>{it.spec}</span>
              </div>
              <div className="meta mono">{window.fmt(window.itemLevelPrice(it, 1))}원</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const blankRow = () => ({ key: Math.random().toString(36).slice(2), itemId: null, itemName: '', spec: '', qty: '', price: 0 });

const EntryScreen = ({ onPrint, onSaved, onNav, editTx }) => {
  const state = window.Store.state;
  const isEdit = !!editTx;
  const [customerId, setCustomerId] = useState(editTx?.customerId || (state.customers[0]?.id || 1));
  const [date, setDate] = useState(editTx?.date || window.todayKey());
  const [rows, setRows] = useState(() => {
    if (editTx?.lines && editTx.lines.length) {
      const r = editTx.lines.map((l, i) => {
        const it = window.findItem(l.itemId);
        return {
          key: 'e' + i,
          itemId: l.itemId,
          itemName: l.name || (it ? it.name + (it.variety ? ` · ${it.variety}` : '') : ''),
          spec: l.spec || it?.spec || '',
          qty: l.qty,
          price: l.price,
        };
      });
      r.push(blankRow());
      return r;
    }
    return [blankRow()];
  });
  const [payment, setPayment] = useState(editTx?.method || 'credit');
  const [memo, setMemo] = useState(editTx?.memo || '');
  const [hasVat, setHasVat] = useState(
    editTx ? (editTx.hasVat !== undefined ? editTx.hasVat : (editTx.vat || 0) > 0) : false
  );
  const [boxCount, setBoxCount] = useState(editTx?.boxCount || 0);
  const [savedToast, setSavedToast] = useState(false);
  const BOX_UNIT = 500;

  const updateRow = (key, patch) => {
    setRows(rs => {
      const next = rs.map(r => r.key === key ? { ...r, ...patch } : r);
      if (next[next.length - 1].itemId) next.push(blankRow());
      return next;
    });
  };

  const removeRow = (key) => setRows(rs => {
    const filtered = rs.filter(r => r.key !== key);
    return filtered.length === 0 ? [blankRow()] : filtered;
  });

  const subtotal = rows.reduce((a, r) => a + (Number(r.qty) || 0) * (Number(r.price) || 0), 0);
  const vat = hasVat ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + vat;
  const boxDeduct = (Number(boxCount) || 0) * BOX_UNIT;          // 상자수 × 500
  const exBoxTotal = Math.max(0, total - boxDeduct);              // 상자제외 청구금액
  const customer = window.findCustomer(customerId);
  const prevDue = customer?.due || 0;                             // 현 거래 이전까지 미수금

  const finalRows = () => rows.filter(r => r.itemId && Number(r.qty) > 0);

  const lineData = () => finalRows().map(r => ({
    itemId: r.itemId, name: r.itemName, spec: r.spec,
    qty: Number(r.qty), price: Number(r.price), lineTotal: Number(r.qty) * Number(r.price)
  }));

  // 거래의 재고/미수금 효과를 적용(+1) 또는 되돌림(-1)
  const applyEffects = (tx, sign) => {
    for (const l of (tx.lines || [])) {
      const it = window.findItem(l.itemId);
      if (it) it.stock = Math.max(0, (it.stock || 0) - sign * Number(l.qty));
    }
    if (tx.method === 'credit') {
      const c = window.findCustomer(tx.customerId);
      if (c) {
        const outstanding = Math.max(0, (tx.total || 0) - (tx.paid || 0));
        c.due = Math.max(0, (c.due || 0) + sign * outstanding);
      }
    }
  };

  const persist = async () => {
    const lines = lineData();
    const charged = exBoxTotal; // 상자제외 청구금액(실제 청구액)
    if (isEdit) {
      const old = state.transactions.find(t => t.id === editTx.id);
      if (old) applyEffects(old, -1); // 기존 효과 원복
      const keepPaid = old && old.method === 'credit'
        ? Math.min(old.paid || 0, charged)
        : (payment === 'credit' ? 0 : charged);
      const tx = {
        ...old,
        id: editTx.id,
        date,
        customerId,
        subtotal, vat,
        fullTotal: subtotal + vat,
        boxCount: Number(boxCount) || 0,
        boxDeduct,
        total: charged,
        method: payment,
        paid: payment === 'credit' ? keepPaid : charged,
        items: lines.length,
        lines,
        memo,
        hasVat,
        updatedAt: new Date().toISOString(),
      };
      const idx = state.transactions.findIndex(t => t.id === editTx.id);
      if (idx >= 0) state.transactions[idx] = tx; else state.transactions.unshift(tx);
      applyEffects(tx, +1); // 새 효과 적용
      for (const l of lines) {
        const i = state.recentItems.indexOf(l.itemId);
        if (i >= 0) state.recentItems.splice(i, 1);
        state.recentItems.unshift(l.itemId);
      }
      state.recentItems = state.recentItems.slice(0, 8);
      const c = window.findCustomer(customerId);
      if (c) c.last = date;
      await window.Store.commit();
      return tx;
    }
    const tx = {
      id: state.nextTransactionId,
      date, customerId, subtotal, vat,
      fullTotal: subtotal + vat,
      boxCount: Number(boxCount) || 0,
      boxDeduct,
      total: charged,
      prevDue,
      paid: payment === 'credit' ? 0 : charged,
      method: payment,
      items: lines.length,
      lines,
      memo, hasVat,
      createdAt: new Date().toISOString(),
    };
    state.transactions.unshift(tx);
    state.nextTransactionId = tx.id + 1;
    for (const l of lines) {
      const idx = state.recentItems.indexOf(l.itemId);
      if (idx >= 0) state.recentItems.splice(idx, 1);
      state.recentItems.unshift(l.itemId);
      const it = window.findItem(l.itemId);
      if (it) it.useCount = (it.useCount || 0) + 1;
    }
    state.recentItems = state.recentItems.slice(0, 8);
    applyEffects(tx, +1);
    const c = window.findCustomer(customerId);
    if (c) c.last = date;
    await window.Store.commit();
    return tx;
  };

  const handleSave = async () => {
    if (finalRows().length === 0) { alert('품목을 1개 이상 입력해 주세요.'); return; }
    await persist();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
    onSaved && onSaved();
  };

  const handleSaveAndPrint = async () => {
    if (finalRows().length === 0) { alert('품목을 1개 이상 입력해 주세요.'); return; }
    const tx = await persist();
    onPrint && onPrint(window.txToInvoice(tx));
  };

  useEffect(() => {
    const onSaveKey = () => { handleSave(); };
    document.addEventListener('saeipari:save', onSaveKey);
    return () => document.removeEventListener('saeipari:save', onSaveKey);
  });

  const handleCancel = () => {
    if (confirm('입력 중인 거래를 취소하시겠습니까?')) {
      setRows([blankRow()]);
      setMemo('');
    }
  };

  const addFavorite = (it) => {
    const blank = rows.find(r => !r.itemId);
    if (!blank) return;
    updateRow(blank.key, {
      itemId: it.id,
      itemName: it.name + (it.variety ? ` · ${it.variety}` : ''),
      spec: it.spec,
      price: window.priceFor(it, customer),
      qty: 1,
    });
  };

  if (state.customers.length === 0 || state.items.length === 0) {
    return (
      <div className="card">
        <div className="card-body" style={{padding:60, textAlign:'center'}}>
          <div className="muted" style={{fontSize:15, marginBottom:8}}>거래를 입력하려면 먼저 거래처와 품목을 등록하세요.</div>
          <div className="muted" style={{fontSize:13, marginBottom:18}}>
            현재 거래처 {state.customers.length}곳 · 품목 {state.items.length}종
          </div>
          <div className="row" style={{justifyContent:'center', gap:10}}>
            <button className="btn btn-primary" onClick={() => onNav && onNav('customers')}><Icons.Users size={16}/> 거래처 등록</button>
            <button className="btn btn-primary" onClick={() => onNav && onNav('inventory')}><Icons.Box size={16}/> 품목 등록</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-grid" onDragStart={e => e.preventDefault()} onDrop={e => e.preventDefault()}>
      <div className="card">
        <div className="card-head">
          <h2>{isEdit ? `거래 수정 · #${editTx.id}` : '새 거래명세서'}</h2>
          <div className="row" style={{gap:8}}>
            <span className="muted" style={{fontSize:13}}>저장 단축키</span>
            <span className="keyhint">Ctrl+S</span>
            <span className="keyhint">Ctrl+P</span>
          </div>
        </div>

        <div className="card-body" style={{display:'flex', flexDirection:'column', gap:18}}>
          <div style={{display:'grid', gridTemplateColumns:'180px 1fr 220px', gap:14}}>
            <div className="field">
              <label>거래일자</label>
              <input className="input mono" type="date"
                value={date.replace(/\./g, '-')}
                onChange={e => setDate(e.target.value ? e.target.value.replace(/-/g, '.') : window.todayKey())}/>
            </div>
            <div className="field">
              <label>거래처</label>
              <select className="select" value={customerId} onChange={e => setCustomerId(Number(e.target.value))}>
                {state.customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({window.levelLabel(c.priceLevel)})</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>이전 미수금</label>
              <div className="input mono" style={{display:'flex', alignItems:'center', justifyContent:'flex-end',
                color: customer?.due > 0 ? 'var(--warn)' : 'var(--ink-muted)', fontWeight: 700, background:'#FBF7EE'}}>
                {window.fmt(customer?.due || 0)}원
              </div>
            </div>
          </div>

          <div>
            <div className="row-grid head">
              <div style={{textAlign:'center'}}>No.</div><div>품목</div><div>규격</div><div className="right">수량</div><div className="right">단가</div><div className="right">공급가액</div><div></div>
            </div>
            <div className="col" style={{gap:6, paddingTop:8}}>
              {rows.map((r, idx) => {
                return (
                  <div key={r.key} className="row-grid">
                    <div className="row-no">{idx + 1}</div>
                    <ItemAutocomplete
                      value={r.itemName}
                      onChange={v => updateRow(r.key, { itemName: v })}
                      onSelect={(it) => updateRow(r.key, {
                        itemId: it.id,
                        itemName: it.name + (it.variety ? ` · ${it.variety}` : ''),
                        spec: it.spec,
                        price: window.priceFor(it, customer),
                      })}
                    />
                    <input className="row-input" value={r.spec} onChange={e => updateRow(r.key, { spec: e.target.value })} placeholder="규격"/>
                    <input className="row-input row-num" value={r.qty} onChange={e => updateRow(r.key, { qty: Number(e.target.value) || 0 })} placeholder="0"/>
                    <input className="row-input row-num" value={r.price} onChange={e => updateRow(r.key, { price: Number(e.target.value) || 0 })} placeholder="0"/>
                    <div className="row-input row-num" style={{background:'#FBF7EE', display:'flex', alignItems:'center', justifyContent:'flex-end', fontWeight:600}}>
                      {window.fmt((Number(r.qty) || 0) * (Number(r.price) || 0))}
                    </div>
                    <button className="btn btn-sm btn-ghost" onClick={() => removeRow(r.key)} title="행 삭제"><Icons.Trash size={16}/></button>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 280px', gap:14}}>
            <div className="field">
              <label>비고</label>
              <textarea className="textarea" rows={2} value={memo} onChange={e => setMemo(e.target.value)} placeholder="거래 관련 메모 (선택)"/>
              <label style={{marginTop:8}}>상자 수 (개당 {window.fmt(BOX_UNIT)}원 공제)</label>
              <input className="input mono" type="number" min="0" value={boxCount}
                onChange={e => setBoxCount(Math.max(0, Number(e.target.value) || 0))} placeholder="0"/>
            </div>
            <div className="field">
              <label>결제 방식</label>
              <div className="seg" style={{width:'100%'}}>
                <button className={payment === 'cash' ? 'on' : ''} style={{flex:1}} onClick={() => setPayment('cash')}>현금</button>
                <button className={payment === 'transfer' ? 'on' : ''} style={{flex:1}} onClick={() => setPayment('transfer')}>이체</button>
                <button className={payment === 'credit' ? 'on' : ''} style={{flex:1}} onClick={() => setPayment('credit')}>외상</button>
              </div>
              <label style={{marginTop:10, marginBottom:4, fontSize:13, color:'var(--ink-soft)', fontWeight:500}}>부가세</label>
              <div className="seg" style={{width:'100%'}}>
                <button className={hasVat ? 'on' : ''} style={{flex:1}} onClick={() => setHasVat(true)}>부가세 있음 (10%)</button>
                <button className={!hasVat ? 'on' : ''} style={{flex:1}} onClick={() => setHasVat(false)}>부가세 없음</button>
              </div>
            </div>
          </div>
        </div>

        <div className="entry-footer">
          <div className="totals">
            <div><span className="lbl">공급가</span> <span className="val mono">{window.fmt(subtotal)}원</span></div>
            <div><span className="lbl">부가세</span> <span className="val mono">{window.fmt(vat)}원</span></div>
            <div><span className="lbl">합계</span> <span className="val mono">{window.fmt(total)}원</span></div>
            {boxCount > 0 && <div><span className="lbl">상자공제</span> <span className="val mono" style={{color:'var(--warn)'}}>-{window.fmt(boxDeduct)}원</span></div>}
            <div><span className="lbl">상자제외 청구</span> <span className="val grand mono">{window.fmt(exBoxTotal)}원</span></div>
          </div>
          <div className="row" style={{gap:10}}>
            <button className="btn btn-lg" onClick={isEdit ? () => onSaved && onSaved() : handleCancel}>{isEdit ? '닫기' : '취소'}</button>
            <button className="btn btn-lg" onClick={handleSave}><Icons.Save size={18}/> {isEdit ? '수정 저장' : '저장'}</button>
            <button className="btn btn-lg btn-primary" onClick={handleSaveAndPrint}>
              <Icons.Print size={18}/> {isEdit ? '저장 후 재출력' : '저장 후 인쇄'}
            </button>
          </div>
        </div>
      </div>

      <div className="col" style={{gap:14}}>
        <div className="card">
          <div className="card-head"><h2><Icons.Star size={16}/> 즐겨찾는 품목</h2></div>
          <div className="card-body" style={{padding:14}}>
            <div className="fav-list">
              {(state.favoriteItems || []).slice(0, 10).map((id, i) => {
                const it = window.findItem(id);
                if (!it) return null;
                return (
                  <button className="fav-item" key={id} onClick={() => addFavorite(it)}>
                    <div className="row" style={{gap:10}}>
                      <span className="fav-rank">{i + 1}</span>
                      <div>
                        <div className="name">{it.name}{it.variety && <span className="muted" style={{fontWeight:400, marginLeft:4, fontSize:12}}>· {it.variety}</span>}</div>
                        <div className="spec">{it.spec} · {window.fmt(window.priceFor(it, customer))}원</div>
                      </div>
                    </div>
                    <Icons.Plus size={16}/>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>거래 템플릿</h2></div>
          <div className="card-body" style={{padding:14}}>
            <div className="fav-list">
              {(state.templates || []).map(t => (
                <button className="fav-item" key={t.id} onClick={() => {
                  if (!confirm(`'${t.name}' 템플릿을 적용하시겠습니까? (현재 입력 내용 대체)`)) return;
                  setCustomerId(t.customerId);
                  setRows(t.lines.map((l, i) => {
                    const it = window.findItem(l.itemId);
                    return {
                      key: 'tp' + i,
                      itemId: l.itemId,
                      itemName: it ? it.name + (it.variety ? ` · ${it.variety}` : '') : '',
                      spec: it?.spec || '',
                      qty: l.qty,
                      price: window.priceFor(it, window.findCustomer(t.customerId))
                    };
                  }).concat(blankRow()));
                }}>
                  <div>
                    <div className="name">{t.name}</div>
                    <div className="spec">{t.desc}</div>
                  </div>
                  <Icons.ArrowRight size={16}/>
                </button>
              ))}
              {(state.templates || []).length === 0 && <div className="muted" style={{fontSize:13, padding:8}}>저장된 템플릿이 없습니다.</div>}
            </div>
          </div>
        </div>
      </div>

      {savedToast && <div className="toast">저장되었습니다 ✓</div>}
    </div>
  );
};

window.EntryScreen = EntryScreen;
