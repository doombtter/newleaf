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

  const totalSales = state.transactions.reduce((a, t) => a + (t.total || 0), 0);
  const totalPaid = state.transactions.reduce((a, t) => a + (t.paid || 0), 0);
  const totalDue = state.customers.reduce((a, c) => a + (c.due || 0), 0);
  const txCount = state.transactions.length;

  // 품목별 집계 (lines가 비어있는 시드는 가상의 균등 분배)
  const itemSalesMap = {};
  state.transactions.forEach(t => {
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
  state.transactions.forEach(t => {
    custSalesMap[t.customerId] = (custSalesMap[t.customerId] || 0) + (t.total || 0);
  });
  const customerSales = Object.entries(custSalesMap)
    .map(([id, amt]) => ({ name: window.findCustomer(Number(id))?.name || '—', amt }))
    .sort((a, b) => b.amt - a.amt).slice(0, 8);
  const maxCust = Math.max(...customerSales.map(i => i.amt), 1);

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

  const exports = [
    {
      title: '거래 내역', desc: '기간 내 모든 거래', file: `transactions_${window.todayKey()}.csv`,
      run: () => exportCSV(`transactions_${window.todayKey()}.csv`,
        ['거래일', '거래번호', '거래처', '품목수', '공급가', '부가세', '합계', '결제', '수금', '미수', '비고'],
        state.transactions.map(t => {
          const c = window.findCustomer(t.customerId);
          return [t.date, t.id, c?.name || '', t.items, t.subtotal || 0, t.vat || 0, t.total, t.method, t.paid || 0, (t.total - (t.paid || 0)), t.memo || ''];
        }))
    },
    {
      title: '거래처별 집계', desc: '매출/미수금', file: `customers_${window.todayKey()}.csv`,
      run: () => exportCSV(`customers_${window.todayKey()}.csv`,
        ['거래처', '대표', '연락처', '단가등급', '거래건수', '매출합계', '미수금'],
        state.customers.map(c => {
          const txs = state.transactions.filter(t => t.customerId === c.id);
          return [c.name, c.owner, c.phone, window.tierLabel(c.tier), txs.length, txs.reduce((a,t)=>a+(t.total||0),0), c.due || 0];
        }))
    },
    {
      title: '품목별 판매', desc: '품목·규격·수량', file: `items_${window.todayKey()}.csv`,
      run: () => exportCSV(`items_${window.todayKey()}.csv`,
        ['품목', '품종', '규격', '단가', '재고', '안전재고', '판매빈도', '육묘일'],
        state.items.map(i => [i.name, i.variety || '', i.spec, i.price, i.stock, i.safety, i.useCount || 0, i.growing]))
    },
    {
      title: '재고 현황', desc: '안전재고 포함', file: `stock_${window.todayKey()}.csv`,
      run: () => exportCSV(`stock_${window.todayKey()}.csv`,
        ['품목', '규격', '현재재고(트레이)', '안전재고', '상태'],
        state.items.map(i => [i.name + (i.variety ? ' ' + i.variety : ''), i.spec, i.stock, i.safety, i.stock < i.safety ? '미달' : i.stock < i.safety * 1.5 ? '부족' : '정상']))
    },
    {
      title: '파종/출하 일정', desc: '진행중 + 완료', file: `sowings_${window.todayKey()}.csv`,
      run: () => exportCSV(`sowings_${window.todayKey()}.csv`,
        ['파종일', '품목', '규격', '트레이수', '출하예정일', '상태', '비고'],
        state.sowings.map(s => {
          const it = window.findItem(s.itemId);
          return [s.sowDate, it?.name || '', `${s.traySize}구`, s.trays, s.shipDate, s.status, s.memo || ''];
        }))
    },
    {
      title: '전체 백업 (JSON)', desc: '데이터베이스 전체', file: `saeipari_backup_${window.todayKey()}.json`,
      run: async () => {
        await window.Store.exportJSON(`saeipari_backup_${window.todayKey()}.json`);
      }
    },
  ];

  return (
    <div className="col" style={{gap:18}}>
      <div className="card">
        <div className="card-head">
          <h2>매출 통계</h2>
          <div className="row" style={{gap:10}}>
            <div className="seg">
              <button className={period === 'week' ? 'on' : ''} onClick={() => setPeriod('week')}>이번 주</button>
              <button className={period === 'month' ? 'on' : ''} onClick={() => setPeriod('month')}>이번 달</button>
              <button className={period === 'quarter' ? 'on' : ''} onClick={() => setPeriod('quarter')}>이번 분기</button>
              <button className={period === 'year' ? 'on' : ''} onClick={() => setPeriod('year')}>올해</button>
            </div>
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

          <div className="section-title"><h2>일별 매출 추이 (최근 14일)</h2></div>
          <Sparkline data={state.dailyRevenue || []}/>
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
          <h2>데이터 내보내기 (CSV / JSON)</h2>
          <span className="muted" style={{fontSize:13}}>오프라인 · 인터넷 불필요</span>
        </div>
        <div className="card-body" style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
          {exports.map((e, i) => (
            <button key={i} className="alert-card" style={{textAlign:'left', cursor:'pointer', border:'1px solid var(--line)'}} onClick={e.run}>
              <div className="badge"><Icons.Download size={18}/></div>
              <div className="body">
                <h4>{e.title}</h4>
                <p>{e.desc} · <span className="mono" style={{fontSize:12}}>{e.file}</span></p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

window.StatsScreen = StatsScreen;
