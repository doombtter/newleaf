// 매출 통계
const Sparkline = ({ data, w = 720, h = 200 }) => {
  if (!data || data.length === 0) return <div className="muted" style={{padding:40, textAlign:'center'}}>데이터 없음</div>;
  const max = Math.max(...data.map(d => d[1]), 1);
  const stepX = w / Math.max(1, data.length - 1);
  const pts = data.map((d, i) => [i * stepX, h - (d[1] / max) * (h - 30) - 6]);
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = path + ` L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:'100%', height:240}}>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A7A52" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#3A7A52" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#g)"/>
      <path d={path} fill="none" stroke="#2D5F3F" strokeWidth="2.5" strokeLinejoin="round"/>
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke="#2D5F3F" strokeWidth="2"/>
          <text x={p[0]} y={h - 2} fontSize="10" fill="#8A8579" textAnchor="middle">{data[i][0]}</text>
        </g>
      ))}
    </svg>
  );
};

const StatsScreen = () => {
  const state = window.Store.state;
  const [period, setPeriod] = React.useState('month');
  const fmtKey = (dt) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  const today = new Date();
  const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
  const [customFrom, setCustomFrom] = React.useState(fmtKey(monthAgo));
  const [customTo, setCustomTo] = React.useState(fmtKey(today));
  const [ym, setYm] = React.useState(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`);
  const [viewer, setViewer] = React.useState(null); // { title, headers, rows }
  const [aggOpen, setAggOpen] = React.useState(false);

  const toDate = (s) => { const [y, m, d] = (s || '').split('.').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const now = new Date(); now.setHours(23,59,59,999);
  const rangeStart = (() => {
    if (period === 'week') { const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0,0,0,0); return d; }
    if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    if (period === 'custom') { const [y,m,d] = customFrom.split('-').map(Number); return new Date(y, m-1, d, 0,0,0,0); }
    if (period === 'ym') { const [y,m] = ym.split('-').map(Number); return new Date(y, m-1, 1, 0,0,0,0); }
    return new Date(now.getFullYear(), 0, 1); // year
  })();
  const rangeEnd = (() => {
    if (period === 'custom') { const [y,m,d] = customTo.split('-').map(Number); return new Date(y, m-1, d, 23,59,59,999); }
    if (period === 'ym') { const [y,m] = ym.split('-').map(Number); return new Date(y, m, 0, 23,59,59,999); }
    return now;
  })();
  const periodLabel = {
    week: '최근 7일', month: '이번 달', quarter: '이번 분기', year: '올해',
    custom: `${customFrom} ~ ${customTo}`,
    ym: `${ym.split('-')[0]}년 ${Number(ym.split('-')[1])}월`
  }[period];
  const inRange = (dateStr) => { const dt = toDate(dateStr); return dt >= rangeStart && dt <= rangeEnd; };
  const txns = state.transactions.filter(t => inRange(t.date));

  const totalSales = txns.reduce((a, t) => a + (t.total || 0), 0);
  const totalPaid = txns.reduce((a, t) => a + (t.paid || 0), 0);
  const totalDue = state.customers.reduce((a, c) => a + (c.due || 0), 0);
  const txCount = txns.length;

  // 품목별 집계
  const itemSalesMap = {};
  txns.forEach(t => {
    if (t.lines && t.lines.length) {
      t.lines.forEach(l => {
        const it = window.findItem(l.itemId);
        if (!it) return;
        const key = `${it.name} ${it.spec}`;
        itemSalesMap[key] = (itemSalesMap[key] || 0) + (l.lineTotal || 0);
      });
    }
  });
  const itemSales = Object.entries(itemSalesMap).map(([name, amt]) => ({ name, amt })).sort((a, b) => b.amt - a.amt).slice(0, 8);
  const maxItem = Math.max(...itemSales.map(i => i.amt), 1);

  // 거래처별 집계
  const custSalesMap = {};
  txns.forEach(t => {
    custSalesMap[t.customerId] = (custSalesMap[t.customerId] || 0) + (t.total || 0);
  });
  const customerSales = Object.entries(custSalesMap)
    .map(([id, amt]) => ({ name: window.findCustomer(Number(id))?.name || '—', amt }))
    .sort((a, b) => b.amt - a.amt).slice(0, 8);
  const maxCust = Math.max(...customerSales.map(i => i.amt), 1);

  // 매출 추이: 주/월은 일별, 분기/년은 월별
  const pad = (n) => String(n).padStart(2, '0');
  const series = (() => {
    const out = [];
    const spanDays = Math.round((rangeEnd - rangeStart) / 86400000);
    const monthly = period === 'quarter' || period === 'year' || spanDays > 62;
    if (monthly) {
      const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
      while (cur <= rangeEnd) {
        const y = cur.getFullYear(), m = cur.getMonth();
        const sum = txns.filter(t => { const d = toDate(t.date); return d.getFullYear() === y && d.getMonth() === m; })
          .reduce((a, t) => a + (t.total || 0), 0);
        out.push([`${pad(m + 1)}월`, sum]);
        cur.setMonth(cur.getMonth() + 1);
      }
    } else {
      const cur = new Date(rangeStart);
      while (cur <= rangeEnd) {
        const key = `${cur.getFullYear()}.${pad(cur.getMonth() + 1)}.${pad(cur.getDate())}`;
        const sum = txns.filter(t => t.date === key).reduce((a, t) => a + (t.total || 0), 0);
        out.push([`${pad(cur.getMonth() + 1)}.${pad(cur.getDate())}`, sum]);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return out.length ? out : [['', 0]];
  })();

  const exportCSV = (filename, headers, rows) => {
    const BOM = '﻿';
    const escape = (v) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = BOM + [headers, ...rows].map(r => r.map(escape).join(',')).join('\r\n');
    if (window.IS_ELECTRON && window.saeipari?.exportFile) {
      window.saeipari.exportFile({ suggestedName: filename, content: csv });
    } else {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
    }
  };

  const datasets = [
    {
      title: '거래 내역', desc: `${periodLabel} 거래`, file: `transactions_${period}_${window.todayKey()}.csv`,
      headers: ['거래일', '거래번호', '거래처', '품목수', '공급가', '부가세', '합계', '결제', '수금', '미수', '비고'],
      getRows: () => txns.map(t => {
        const c = window.findCustomer(t.customerId);
        return [t.date, t.id, c?.name || '', t.items, t.subtotal || 0, t.vat || 0, t.total, t.method, t.paid || 0, (t.total - (t.paid || 0)), t.memo || ''];
      }),
    },
    {
      title: '재고 현황', desc: '안전재고 포함', file: `stock_${window.todayKey()}.csv`,
      headers: ['품목', '규격', '현재재고(트레이)', '안전재고', '상태'],
      getRows: () => state.items.map(i => [i.name + (i.variety ? ' ' + i.variety : ''), i.spec, i.stock, i.safety, i.stock < i.safety ? '미달' : i.stock < i.safety * 1.5 ? '부족' : '정상']),
    },
    {
      title: '파종/출하 일정', desc: '진행중 + 완료', file: `sowings_${window.todayKey()}.csv`,
      headers: ['파종일', '품목', '규격', '트레이수', '출하예정일', '상태', '비고'],
      getRows: () => state.sowings.map(s => {
        const it = window.findItem(s.itemId);
        return [s.sowDate, it?.name || '', `${s.traySize}구`, s.trays, s.shipDate, s.status, s.memo || ''];
      }),
    },
  ];

  return (
    <div className="col" style={{gap:18}}>
      <div className="card">
        <div className="card-head">
          <h2>매출 통계</h2>
          <div className="row" style={{gap:10, flexWrap:'wrap', justifyContent:'flex-end'}}>
            <div className="seg">
              <button className={period === 'week' ? 'on' : ''} onClick={() => setPeriod('week')}>이번 주</button>
              <button className={period === 'month' ? 'on' : ''} onClick={() => setPeriod('month')}>이번 달</button>
              <button className={period === 'quarter' ? 'on' : ''} onClick={() => setPeriod('quarter')}>이번 분기</button>
              <button className={period === 'year' ? 'on' : ''} onClick={() => setPeriod('year')}>올해</button>
              <button className={period === 'ym' ? 'on' : ''} onClick={() => setPeriod('ym')}>월 지정</button>
              <button className={period === 'custom' ? 'on' : ''} onClick={() => setPeriod('custom')}>사용자 지정</button>
            </div>
            {period === 'ym' && (
              <div className="row" style={{gap:6}}>
                <input type="month" className="input" style={{height:34, fontSize:13, padding:'0 8px'}}
                  value={ym} onChange={e => setYm(e.target.value)}/>
              </div>
            )}
            {period === 'custom' && (
              <div className="row" style={{gap:6}}>
                <input type="date" className="input" style={{height:34, fontSize:13, padding:'0 8px'}}
                  value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)}/>
                <span className="muted">~</span>
                <input type="date" className="input" style={{height:34, fontSize:13, padding:'0 8px'}}
                  value={customTo} min={customFrom} onChange={e => setCustomTo(e.target.value)}/>
              </div>
            )}
          </div>
        </div>
        <div className="card-body">
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:18}}>
            <div className="stat">
              <div className="label">총 매출</div>
              <div className="value">{window.fmt(totalSales)}원</div>
              <div className="delta">{txCount}건 거래</div>
            </div>
            <div className="stat">
              <div className="label">총 수금</div>
              <div className="value" style={{color:'var(--green-800)'}}>{window.fmt(totalPaid)}원</div>
              <div className="delta">수금률 {totalSales ? Math.round(totalPaid / totalSales * 100) : 0}%</div>
            </div>
            <div className="stat warn">
              <div className="label">미수금 잔액</div>
              <div className="value">{window.fmt(totalDue)}원</div>
            </div>
            <div className="stat">
              <div className="label">거래 건수</div>
              <div className="value">{txCount}<span style={{fontSize:14, color:'var(--ink-muted)', marginLeft:6, fontFamily:'inherit'}}>건</span></div>
              <div className="delta">평균 {window.fmt(txCount ? Math.round(totalSales / txCount) : 0)}원/건</div>
            </div>
          </div>

          <div className="section-title"><h2>매출 추이 · {periodLabel}</h2></div>
          <Sparkline data={series}/>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18}}>
        <div className="card">
          <div className="card-head"><h2>품목별 매출 순위</h2></div>
          <div className="card-body">
            {itemSales.length === 0 && <div className="muted" style={{padding:20}}>거래 데이터가 없습니다.</div>}
            {itemSales.map((it, i) => (
              <div key={i} className="bar-row">
                <div className="name"><span className="muted mono" style={{marginRight:8}}>{i + 1}</span>{it.name}</div>
                <div className="bar-track"><div className="bar-fill" style={{width: (it.amt / maxItem * 100) + '%'}}/></div>
                <div className="num">{window.fmt(it.amt)}원</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h2>거래처별 매출 순위</h2></div>
          <div className="card-body">
            {customerSales.length === 0 && <div className="muted" style={{padding:20}}>거래 데이터가 없습니다.</div>}
            {customerSales.map((c, i) => (
              <div key={i} className="bar-row">
                <div className="name"><span className="muted mono" style={{marginRight:8}}>{i + 1}</span>{c.name}</div>
                <div className="bar-track"><div className="bar-fill" style={{width: (c.amt / maxCust * 100) + '%'}}/></div>
                <div className="num">{window.fmt(c.amt)}원</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>데이터 조회 / 내보내기</h2>
          <span className="muted" style={{fontSize:13}}>화면 조회 또는 CSV 저장 · 오프라인</span>
        </div>
        <div className="card-body" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
          {datasets.map((ds, i) => (
            <div key={i} className="alert-card" style={{border:'1px solid var(--line)'}}>
              <div className="badge"><Icons.Chart size={18}/></div>
              <div className="body">
                <h4>{ds.title}</h4>
                <p>{ds.desc}</p>
                <div className="row" style={{gap:6, marginTop:8}}>
                  <button className="btn btn-sm" onClick={() => setViewer({ title: ds.title, headers: ds.headers, rows: ds.getRows(), desc: ds.desc })}>
                    <Icons.Search size={14}/> 화면 조회
                  </button>
                  <button className="btn btn-sm" onClick={() => exportCSV(ds.file, ds.headers, ds.getRows())}>
                    <Icons.Download size={14}/> 내보내기
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="alert-card" style={{border:'1px solid var(--line)'}}>
            <div className="badge"><Icons.Users size={18}/></div>
            <div className="body">
              <h4>거래처별 품목 집계</h4>
              <p>거래처 선택 → 월별·연별·기간별 품목 집계</p>
              <div className="row" style={{gap:6, marginTop:8}}>
                <button className="btn btn-sm" onClick={() => setAggOpen(true)}>
                  <Icons.Search size={14}/> 화면 조회
                </button>
              </div>
            </div>
          </div>
          <div className="alert-card" style={{border:'1px solid var(--line)'}}>
            <div className="badge"><Icons.Save size={18}/></div>
            <div className="body">
              <h4>전체 백업 (JSON)</h4>
              <p>데이터베이스 전체</p>
              <div className="row" style={{gap:6, marginTop:8}}>
                <button className="btn btn-sm" onClick={() => window.Store.exportJSON(`saeipari_backup_${window.todayKey()}.json`)}>
                  <Icons.Download size={14}/> JSON 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewer && <DataViewerModal data={viewer} onClose={() => setViewer(null)} onExport={() => exportCSV((viewer.title + '_' + window.todayKey() + '.csv'), viewer.headers, viewer.rows)}/>}
      {aggOpen && <CustomerItemAggModal onClose={() => setAggOpen(false)} exportCSV={exportCSV}/>}
    </div>
  );
};

const CustomerItemAggModal = ({ onClose, exportCSV }) => {
  const state = window.Store.state;
  const customers = [...state.customers].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const [custId, setCustId] = React.useState(customers[0]?.id || null);
  const [mode, setMode] = React.useState('month'); // month | year | range
  const fmtKey = (dt) => `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  const ago = new Date(); ago.setMonth(ago.getMonth() - 3);
  const [from, setFrom] = React.useState(fmtKey(ago));
  const [to, setTo] = React.useState(fmtKey(new Date()));

  const toDate = (s) => { const [y, m, d] = (s || '').split('.').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const cust = window.findCustomer(custId);
  const myTx = state.transactions.filter(t => t.customerId === custId);

  // 품목 집계: 기간키(월/연/전체) → 품목별 수량·금액
  const buildAgg = () => {
    const groups = {}; // key -> { itemKey -> {qty, amt} }
    const inRange = (ds) => {
      if (mode !== 'range') return true;
      const dt = toDate(ds);
      const [fy,fm,fd] = from.split('-').map(Number);
      const [ty,tm,td] = to.split('-').map(Number);
      return dt >= new Date(fy,fm-1,fd) && dt <= new Date(ty,tm-1,td,23,59,59);
    };
    myTx.forEach(t => {
      if (!inRange(t.date)) return;
      const [y, m] = t.date.split('.');
      const key = mode === 'year' ? `${y}년` : mode === 'month' ? `${y}.${m}` : '기간 합계';
      (t.lines || []).forEach(l => {
        const it = window.findItem(l.itemId);
        const ik = (l.name || it?.name || '품목') + (l.spec ? ` (${l.spec})` : '');
        groups[key] = groups[key] || {};
        groups[key][ik] = groups[key][ik] || { qty: 0, amt: 0 };
        groups[key][ik].qty += Number(l.qty || 0);
        groups[key][ik].amt += Number(l.lineTotal || 0);
      });
    });
    const rows = [];
    Object.keys(groups).sort().forEach(period => {
      const items = groups[period];
      Object.keys(items).sort((a, b) => items[b].amt - items[a].amt).forEach(ik => {
        rows.push([period, ik, items[ik].qty, items[ik].amt]);
      });
    });
    return rows;
  };
  const rows = custId ? buildAgg() : [];
  const headers = [mode === 'year' ? '연도' : mode === 'month' ? '월' : '기간', '품목', '수량', '금액'];
  const totalQty = rows.reduce((a, r) => a + r[2], 0);
  const totalAmt = rows.reduce((a, r) => a + r[3], 0);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{maxWidth:900}} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3><Icons.Users size={16}/> &nbsp; 거래처별 품목 집계</h3>
          <div className="modal-actions">
            <button className="btn btn-sm" style={{height:32}} disabled={rows.length === 0}
              onClick={() => exportCSV(`거래처품목집계_${cust?.name || ''}_${window.todayKey()}.csv`, headers, rows)}>
              <Icons.Download size={14}/> CSV 저장
            </button>
            <button className="icon-btn" onClick={onClose}><Icons.X size={18}/></button>
          </div>
        </div>
        <div style={{background:'#fff', padding:18}}>
          <div className="row" style={{gap:10, flexWrap:'wrap', marginBottom:14}}>
            <select className="select" value={custId || ''} onChange={e => setCustId(Number(e.target.value))} style={{minWidth:220}}>
              {customers.length === 0 && <option value="">거래처 없음</option>}
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="seg">
              <button className={mode === 'month' ? 'on' : ''} onClick={() => setMode('month')}>월별</button>
              <button className={mode === 'year' ? 'on' : ''} onClick={() => setMode('year')}>연별</button>
              <button className={mode === 'range' ? 'on' : ''} onClick={() => setMode('range')}>기간 지정</button>
            </div>
            {mode === 'range' && (
              <div className="row" style={{gap:6}}>
                <input type="date" className="input" style={{height:34, fontSize:13, padding:'0 8px'}} value={from} max={to} onChange={e => setFrom(e.target.value)}/>
                <span className="muted">~</span>
                <input type="date" className="input" style={{height:34, fontSize:13, padding:'0 8px'}} value={to} min={from} onChange={e => setTo(e.target.value)}/>
              </div>
            )}
          </div>
          <div style={{maxHeight:'62vh', overflow:'auto'}}>
            <table className="tx">
              <thead><tr>
                <th style={{width:120}}>{headers[0]}</th>
                <th>품목</th>
                <th className="num" style={{width:100}}>수량</th>
                <th className="num" style={{width:140}}>금액</th>
              </tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:40, color:'var(--ink-muted)'}}>해당 조건의 거래가 없습니다.</td></tr>}
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="mono">{r[0]}</td>
                    <td>{r[1]}</td>
                    <td className="num">{window.fmt(r[2])}</td>
                    <td className="num">{window.fmt(r[3])}원</td>
                  </tr>
                ))}
                {rows.length > 0 && (
                  <tr style={{background:'#FBF7EE'}}>
                    <td colSpan="2"><b>합계</b></td>
                    <td className="num"><b>{window.fmt(totalQty)}</b></td>
                    <td className="num"><b>{window.fmt(totalAmt)}원</b></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const DataViewerModal = ({ data, onClose, onExport }) => {
  const { title, headers, rows, desc } = data;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{maxWidth:1100}} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3><Icons.Search size={16}/> &nbsp; {title} <span style={{opacity:0.7, fontWeight:400, fontSize:13}}>· {desc}</span></h3>
          <div className="modal-actions">
            <button className="btn btn-sm" style={{height:32}} onClick={onExport}><Icons.Download size={14}/> CSV 저장</button>
            <button className="icon-btn" onClick={onClose}><Icons.X size={18}/></button>
          </div>
        </div>
        <div style={{background:'#fff', padding:0, maxHeight:'76vh', overflow:'auto'}}>
          <table className="tx">
            <thead><tr>
              {headers.map((h, i) => <th key={i} className={i === 0 ? '' : 'num'} style={i === 0 ? {} : { textAlign:'right' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={headers.length} style={{textAlign:'center', padding:40, color:'var(--ink-muted)'}}>표시할 데이터가 없습니다.</td></tr>}
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} className={ci === 0 ? '' : 'num'}>
                      {typeof c === 'number' ? window.fmt(c) : c}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length > 0 && (
                <tr style={{background:'#FBF7EE'}}>
                  <td><b>합계 {rows.length}건</b></td>
                  {headers.slice(1).map((h, i) => {
                    const col = i + 1;
                    const allNum = rows.every(r => typeof r[col] === 'number');
                    const sum = allNum ? rows.reduce((a, r) => a + (r[col] || 0), 0) : '';
                    return <td key={i} className="num">{allNum ? window.fmt(sum) : ''}</td>;
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

window.StatsScreen = StatsScreen;
