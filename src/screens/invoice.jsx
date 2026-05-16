// 거래명세서 인쇄 미리보기
const InvoicePage = ({ data, copy }) => {
  const { customer, date, rows, subtotal, vat, total } = data;
  const [, m, d] = (date || window.todayKey()).split('.');
  const totalQty = rows.reduce((a, r) => a + (Number(r.qty) || 0), 0);
  const blankCount = Math.max(0, 50 - rows.length);

  return (
    <div className="invoice-page">
      <div className="invoice-title">거 래 명 세 표</div>
      <div className="invoice-sub">
        <div>({copy})</div>
        <div>등록번호 <b className="mono">{window.BIZ.bizNo}</b></div>
      </div>

      <div className="invoice-info">
        <div className="col">
          <div style={{fontSize:10, color:'#666', marginBottom:4}}>공 급 받 는 자</div>
          <table>
            <tbody>
              <tr><td className="k">상호</td><td><b>{customer?.name || ''}</b></td></tr>
              <tr><td className="k">대표자</td><td>{customer?.owner || ''}</td></tr>
              <tr><td className="k">사업장</td><td>{customer?.address || ''}</td></tr>
              <tr><td className="k">전화</td><td className="mono">{customer?.phone || ''}</td></tr>
              <tr><td className="k">합계금액</td><td className="mono"><b>{window.fmt(total)}원</b> <span style={{color:'#666', fontSize:10, marginLeft:6}}>(VAT 포함)</span></td></tr>
            </tbody>
          </table>
        </div>
        <div className="col">
          <div style={{fontSize:10, color:'#666', marginBottom:4}}>공 급 자</div>
          <table>
            <tbody>
              <tr><td className="k">상호</td><td><b>{window.BIZ.name}</b></td></tr>
              <tr><td className="k">성명</td><td>{window.BIZ.owner} (인)</td></tr>
              <tr><td className="k">사업장</td><td>{window.BIZ.address}</td></tr>
              <tr><td className="k">전화</td><td className="mono">{window.BIZ.phone}</td></tr>
              <tr><td className="k">팩스</td><td className="mono">{window.BIZ.fax}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <table className="invoice-table">
        <thead>
          <tr>
            <th style={{width:34}}>월</th>
            <th style={{width:34}}>일</th>
            <th>품 목</th>
            <th style={{width:60}}>규격</th>
            <th style={{width:50}}>수량</th>
            <th style={{width:80}}>단가</th>
            <th style={{width:90}}>공급가액</th>
            <th style={{width:60}}>세액</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const it = window.findItem(r.itemId);
            return (
              <tr key={i}>
                <td className="mono">{Number(m)}</td>
                <td className="mono">{Number(d)}</td>
                <td className="l">{r.itemName || it?.name}</td>
                <td>{r.spec}</td>
                <td className="r">{r.qty}</td>
                <td className="r">{window.fmt(r.price)}</td>
                <td className="r">{window.fmt(Number(r.qty) * Number(r.price))}</td>
                <td className="r">—</td>
              </tr>
            );
          })}
          {Array.from({ length: blankCount }).map((_, i) => (
            <tr key={'e' + i} className="empty">
              <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-foot">
        <div className="cell">
          <div className="lbl">상자외 합계</div>
          <div className="val">{window.fmt(subtotal)}</div>
        </div>
        <div className="cell">
          <div className="lbl">상자수</div>
          <div className="val">{totalQty}</div>
        </div>
        <div className="cell">
          <div className="lbl">결제 / 입금계좌</div>
          <div style={{fontSize:12}}><b>농협</b> <span className="mono">352-1981-0292-63</span></div>
          <div className="lbl" style={{marginTop:4}}>예금주: {window.BIZ.owner}</div>
        </div>
      </div>

      <div style={{marginTop:8, fontSize:10, color:'#666', textAlign:'center'}}>
        본 거래명세표는 컴퓨터로 작성 발행되었습니다 · {window.BIZ.name}
      </div>
    </div>
  );
};

const InvoiceModal = ({ data, onClose }) => {
  if (!data) return null;
  return (
    <div className="modal-bg no-print" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3><Icons.Print size={16}/> &nbsp; 거래명세서 인쇄 미리보기 (고객용 1장)</h3>
          <div className="modal-actions">
            <button className="btn btn-sm" style={{height:32}} onClick={() => window.print()}><Icons.Print size={14}/> 인쇄</button>
            <button className="icon-btn" onClick={onClose}><Icons.X size={18}/></button>
          </div>
        </div>
        <div style={{background:'#E8E2D2', padding:'10px 0'}}>
          <InvoicePage data={data} copy="공급받는자 보관용"/>
        </div>
      </div>
    </div>
  );
};

window.InvoiceModal = InvoiceModal;
