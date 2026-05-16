// 거래처 관리
const CustomersScreen = ({ onNav }) => {
  const state = window.Store.state;
  const [selectedId, setSelectedId] = React.useState(state.customers[0]?.id || 1);
  const [tab, setTab] = React.useState('history');
  const [search, setSearch] = React.useState('');
  const [editing, setEditing] = React.useState(false);
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [, force] = React.useReducer(x => x + 1, 0);

  const sorted = [...state.customers].sort((a, b) => (b.due || 0) - (a.due || 0));
  const filtered = sorted.filter(c => !search || c.name.includes(search) || (c.phone || '').includes(search));
  const c = window.findCustomer(selectedId) || state.customers[0];
  const txs = state.transactions.filter(t => t.customerId === selectedId);
  const yearTotal = txs.reduce((a, t) => a + (t.total || 0), 0);

  const handleSavePayment = async (amount, method) => {
    if (!amount || amount <= 0) return;
    state.payments = state.payments || [];
    state.payments.unshift({
      id: Date.now(),
      customerId: selectedId,
      amount,
      method,
      paymentDate: window.todayKey(),
      memo: '',
    });
    c.due = Math.max(0, (c.due || 0) - amount);
    // mark oldest credit transactions as paid up to amount
    let remaining = amount;
    const credits = state.transactions.filter(t => t.customerId === selectedId && (t.total - (t.paid || 0)) > 0).sort((a,b) => a.id - b.id);
    for (const t of credits) {
      if (remaining <= 0) break;
      const owed = t.total - (t.paid || 0);
      const apply = Math.min(owed, remaining);
      t.paid = (t.paid || 0) + apply;
      remaining -= apply;
    }
    await window.Store.commit();
    setPaymentOpen(false);
    force();
  };

  const handleDeleteCustomer = async () => {
    const txCount = state.transactions.filter(t => t.customerId === c.id).length;
    const warn = txCount > 0
      ? `'${c.name}' 거래처를 삭제하시겠습니까?\n관련 거래 ${txCount}건은 남지만 거래처 표시는 사라집니다.`
      : `'${c.name}' 거래처를 삭제하시겠습니까?`;
    if (!confirm(warn)) return;
    window.removeCustomer(c.id);
    await window.Store.commit();
    const next = state.customers[0];
    setSelectedId(next ? next.id : null);
    setEditing(false);
    force();
  };

  const handleDeleteTransaction = async (t) => {
    if (!confirm(`#${t.id} 거래(${t.date}, ${window.fmt(t.total)}원)를 삭제하시겠습니까?\n재고와 미수금이 자동으로 원복됩니다.`)) return;
    window.removeTransaction(t.id);
    await window.Store.commit();
    force();
  };

  const handleSaveEdit = async (updated) => {
    Object.assign(c, updated);
    await window.Store.commit();
    setEditing(false);
    force();
  };

  const handleNew = () => {
    const id = state.nextCustomerId || (Math.max(...state.customers.map(x => x.id)) + 1);
    state.nextCustomerId = id + 1;
    state.customers.push({
      id, name: '신규 거래처', owner: '', phone: '', address: '', type: 'individual', tier: 'standard', due: 0, last: '', memo: ''
    });
    setSelectedId(id);
    setEditing(true);
    window.Store.commit();
    force();
  };

  if (state.customers.length === 0) {
    return (
      <div className="card">
        <div className="card-body" style={{padding:60, textAlign:'center'}}>
          <div className="muted" style={{fontSize:15, marginBottom:18}}>등록된 거래처가 없습니다.</div>
          <button className="btn btn-primary" onClick={handleNew}><Icons.Plus size={16}/> 첫 거래처 등록</button>
        </div>
      </div>
    );
  }

  return (
    <div className="split-grid">
      <div className="list-card" style={{height: 'calc(100vh - 160px)', overflow:'hidden', display:'flex', flexDirection:'column'}}>
        <div className="list-search">
          <div style={{position:'relative'}}>
            <input placeholder="거래처명 / 전화번호 검색" value={search} onChange={e => setSearch(e.target.value)} style={{paddingLeft:34}}/>
            <span style={{position:'absolute', left:12, top:12, color:'var(--ink-muted)'}}><Icons.Search size={16}/></span>
          </div>
          <div className="row" style={{justifyContent:'space-between', marginTop:10, fontSize:12, color:'var(--ink-muted)'}}>
            <span>총 {filtered.length}곳 · 미수금 잔액 순</span>
            <button className="btn btn-sm" style={{height:30}} onClick={handleNew}><Icons.Plus size={14}/> 신규</button>
          </div>
        </div>
        <div style={{overflow:'auto', flex:1}}>
          {filtered.map(cu => (
            <div key={cu.id} className={'list-row' + (cu.id === selectedId ? ' selected' : '')} onClick={() => { setSelectedId(cu.id); setEditing(false); }}>
              <div>
                <div className="nm">{cu.name}</div>
                <div className="sub">{window.tierLabel(cu.tier)} · {cu.phone}</div>
              </div>
              <div className={'due ' + ((cu.due || 0) === 0 ? 'zero' : '')}>{(cu.due || 0) === 0 ? '—' : window.fmt(cu.due) + '원'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="col" style={{gap: 18}}>
        <div className="card">
          <div className="card-head">
            <div>
              <h2 style={{marginBottom:4}}>{c.name}</h2>
              <div className="muted" style={{fontSize:13}}>{c.type === 'wholesale' ? '도매 거래처' : '개인 농가'}{c.last ? ` · 마지막 거래 ${c.last}` : ''}</div>
            </div>
            <div className="row" style={{gap:8}}>
              <button className="btn btn-sm" onClick={() => setEditing(true)}>정보 수정</button>
              <button className="btn btn-sm" style={{color:'var(--danger)'}} onClick={() => handleDeleteCustomer()}><Icons.Trash size={14}/> 삭제</button>
              <button className="btn btn-sm btn-primary" onClick={() => setPaymentOpen(true)}><Icons.Wallet size={16}/> 수금 입력</button>
            </div>
          </div>
          <div className="card-body">
            {!editing ? (
              <div className="detail-grid">
                <div className="kv"><span className="k">대표자</span><span className="v">{c.owner || '—'}</span></div>
                <div className="kv"><span className="k">연락처</span><span className="v mono">{c.phone || '—'}</span></div>
                <div className="kv" style={{gridColumn:'span 2'}}><span className="k">주소</span><span className="v" style={{fontSize:14}}>{c.address || '—'}</span></div>
                <div className="kv"><span className="k">단가 등급</span><span className="v">{window.tierLabel(c.tier)}</span></div>
                <div className="kv"><span className="k">올해 누적 매출</span><span className="v mono">{window.fmt(yearTotal)}원</span></div>
                <div className="kv"><span className="k">올해 거래 건수</span><span className="v">{txs.length}건</span></div>
                <div className="kv" style={{background: c.due > 0 ? 'var(--warn-soft)' : 'var(--green-50)'}}>
                  <span className="k">미수금 잔액</span>
                  <span className="v mono" style={{color: c.due > 0 ? 'var(--warn)' : 'var(--green-800)'}}>{window.fmt(c.due || 0)}원</span>
                </div>
              </div>
            ) : (
              <CustomerEditForm customer={c} onSave={handleSaveEdit} onCancel={() => setEditing(false)}/>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body" style={{paddingBottom:0}}>
            <div className="tabs">
              <div className={'tab' + (tab === 'history' ? ' on' : '')} onClick={() => setTab('history')}>거래 이력</div>
              <div className={'tab' + (tab === 'due' ? ' on' : '')} onClick={() => setTab('due')}>미수금 명세</div>
              <div className={'tab' + (tab === 'prices' ? ' on' : '')} onClick={() => setTab('prices')}>전용 단가표</div>
              <div className={'tab' + (tab === 'memo' ? ' on' : '')} onClick={() => setTab('memo')}>메모</div>
            </div>
          </div>
          <div className="card-body tight">
            {tab === 'history' && (
              <table className="tx">
                <thead><tr>
                  <th style={{width:90}}>거래일</th><th>품목 요약</th>
                  <th className="num" style={{width:140}}>합계</th>
                  <th style={{width:100}}>결제</th>
                  <th style={{width:100}}></th>
                </tr></thead>
                <tbody>
                  {txs.length === 0 && <tr><td colSpan="5" style={{textAlign:'center', padding:40, color:'var(--ink-muted)'}}>거래 이력 없음</td></tr>}
                  {txs.map(t => (
                    <tr key={t.id}>
                      <td className="mono">{t.date}</td>
                      <td>품목 {t.items}건 <span className="muted" style={{fontSize:12, marginLeft:6}}>#{t.id}</span></td>
                      <td className="num"><b>{window.fmt(t.total)}원</b></td>
                      <td>
                        {t.method === 'cash' && <span className="tag tag-green">현금</span>}
                        {t.method === 'transfer' && <span className="tag tag-green">이체</span>}
                        {t.method === 'credit' && <span className="tag tag-warn">외상</span>}
                      </td>
                      <td>
                        <div className="row" style={{gap:4}}>
                          <button className="btn btn-sm btn-ghost" title="재인쇄"><Icons.Print size={14}/></button>
                          <button className="btn btn-sm btn-ghost" style={{color:'var(--danger)'}} title="거래 삭제" onClick={() => handleDeleteTransaction(t)}><Icons.Trash size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {txs.length > 0 && (
                    <tr style={{background:'#FBF7EE'}}>
                      <td colSpan="2"><b>{txs.length}건 합계 (전체)</b></td>
                      <td className="num"><b>{window.fmt(yearTotal)}원</b></td>
                      <td colSpan="2"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            {tab === 'due' && c.due > 0 && (
              <div style={{padding:22}}>
                <div className="alert-card warn">
                  <div className="badge"><Icons.Wallet size={20}/></div>
                  <div className="body">
                    <h4>미수금 합계 {window.fmt(c.due)}원</h4>
                    <p>외상 거래 {txs.filter(t => t.method === 'credit' && (t.total - (t.paid || 0)) > 0).length}건이 누적되어 있습니다.</p>
                  </div>
                </div>
                <table className="tx" style={{marginTop:14}}>
                  <thead><tr><th>거래일</th><th>거래번호</th><th className="num">금액</th><th className="num">미수</th><th></th></tr></thead>
                  <tbody>
                    {txs.filter(t => t.method === 'credit' && (t.total - (t.paid || 0)) > 0).map(t => (
                      <tr key={t.id}>
                        <td className="mono">{t.date}</td>
                        <td className="mono">#{t.id}</td>
                        <td className="num">{window.fmt(t.total)}원</td>
                        <td className="num" style={{color:'var(--warn)'}}><b>{window.fmt(t.total - (t.paid || 0))}원</b></td>
                        <td><button className="btn btn-sm btn-primary" onClick={() => setPaymentOpen(true)}>수금 입력</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {tab === 'due' && (c.due || 0) === 0 && <div style={{padding:60, textAlign:'center', color:'var(--ink-muted)'}}>미수금 없음 ✓</div>}
            {tab === 'prices' && (
              <table className="tx">
                <thead><tr><th>품목</th><th>규격</th><th className="num">기본가</th><th className="num">{c.name} 적용가</th><th></th></tr></thead>
                <tbody>
                  {state.items.slice(0, 10).map(it => (
                    <tr key={it.id}>
                      <td>{it.name} {it.variety && <span className="muted">· {it.variety}</span>}</td>
                      <td>{it.spec}</td>
                      <td className="num">{window.fmt(it.price)}원</td>
                      <td className="num"><b>{window.fmt(window.priceFor(it, c))}원</b></td>
                      <td><span className="muted" style={{fontSize:12}}>{window.tierLabel(c.tier)} 자동</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === 'memo' && (
              <div style={{padding:22}}>
                <textarea className="textarea" rows={6} defaultValue={c.memo} style={{width:'100%'}}
                  onBlur={async (e) => { c.memo = e.target.value; await window.Store.commit(); }}/>
                <div className="muted" style={{marginTop:8, fontSize:12}}>입력란을 벗어나면 자동 저장됩니다.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {paymentOpen && (
        <PaymentModal customer={c} onClose={() => setPaymentOpen(false)} onSave={handleSavePayment}/>
      )}
    </div>
  );
};

const CustomerEditForm = ({ customer, onSave, onCancel }) => {
  const [form, setForm] = React.useState({ ...customer });
  return (
    <div className="col" style={{gap:14}}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <div className="field"><label>거래처명</label><input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/></div>
        <div className="field"><label>대표자</label><input className="input" value={form.owner||''} onChange={e=>setForm({...form, owner:e.target.value})}/></div>
        <div className="field"><label>연락처</label><input className="input mono" value={form.phone||''} onChange={e=>setForm({...form, phone:e.target.value})}/></div>
        <div className="field"><label>거래처 유형</label>
          <select className="select" value={form.type||'individual'} onChange={e=>setForm({...form, type:e.target.value})}>
            <option value="individual">개인 농가</option>
            <option value="wholesale">도매·농협</option>
          </select>
        </div>
        <div className="field" style={{gridColumn:'span 2'}}><label>주소</label><input className="input" value={form.address||''} onChange={e=>setForm({...form, address:e.target.value})}/></div>
        <div className="field"><label>단가 등급</label>
          <select className="select" value={form.tier||'standard'} onChange={e=>setForm({...form, tier:e.target.value})}>
            <option value="standard">일반가</option>
            <option value="regular">단골가 (-7%)</option>
            <option value="wholesale">도매가 (-15%)</option>
          </select>
        </div>
        <div className="field"><label>미수금 잔액 (수동 조정)</label><input className="input mono" value={form.due||0} onChange={e=>setForm({...form, due:Number(e.target.value)||0})}/></div>
      </div>
      <div className="row" style={{justifyContent:'flex-end', gap:8}}>
        <button className="btn" onClick={onCancel}>취소</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}><Icons.Save size={16}/> 저장</button>
      </div>
    </div>
  );
};

const PaymentModal = ({ customer, onClose, onSave }) => {
  const [amount, setAmount] = React.useState(customer.due || 0);
  const [method, setMethod] = React.useState('cash');
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{maxWidth:480}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h3><Icons.Wallet size={16}/> &nbsp; 수금 입력 — {customer.name}</h3>
          <button className="icon-btn" onClick={onClose}><Icons.X size={18}/></button>
        </div>
        <div style={{padding:24, background:'#fff'}}>
          <div className="field" style={{marginBottom:14}}>
            <label>현재 미수금</label>
            <div className="input mono" style={{textAlign:'right', fontWeight:700, color:'var(--warn)', background:'#FBF7EE'}}>{window.fmt(customer.due||0)}원</div>
          </div>
          <div className="field" style={{marginBottom:14}}>
            <label>수금 금액</label>
            <input className="input mono" value={amount} onChange={e=>setAmount(Number(e.target.value)||0)} style={{textAlign:'right'}}/>
          </div>
          <div className="field" style={{marginBottom:18}}>
            <label>수금 방법</label>
            <div className="seg" style={{width:'100%'}}>
              <button className={method==='cash'?'on':''} style={{flex:1}} onClick={()=>setMethod('cash')}>현금</button>
              <button className={method==='transfer'?'on':''} style={{flex:1}} onClick={()=>setMethod('transfer')}>이체</button>
            </div>
          </div>
          <div className="row" style={{justifyContent:'flex-end', gap:8}}>
            <button className="btn" onClick={onClose}>취소</button>
            <button className="btn btn-primary" onClick={() => onSave(amount, method)}>수금 처리</button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.CustomersScreen = CustomersScreen;
