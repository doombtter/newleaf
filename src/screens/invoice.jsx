// 거래명세서 인쇄 미리보기
const InvoicePage = ({ data, copy }) => {
  const { customer, date, rows, subtotal, vat, total } = data;
  const [, m, d] = (date || window.todayKey()).split('.');
  const totalQty = rows.reduce((a, r) => a + (Number(r.qty) || 0), 0);
  const blankCount = Math.max(0, 40 - rows.length);

  return (
    <div className="invoice-page">
      <div className="invoice-title">거 래 명 세 표</div>
      <div className="invoice-sub">
        <div>({copy})</div>
        <div>등록번호 <b className="mono">{window.BIZ.bizNo}</b></div>
      </div>

      <div className="invoice-info">
        <div className="col">
          <div className="inv-party">공 급 받 는 자</div>
          <div className="inv-line">
            <span><i>상호</i> <b>{customer?.name || ''}</b></span>
            <span><i>대표자</i> {customer?.owner || ''}</span>
            <span><i>사업장</i> {customer?.address || ''}</span>
          </div>
          <div className="inv-line">
            <span><i>전화</i> <span className="mono">{customer?.phone || ''}</span></span>
            <span><i>합계금액</i> <b className="mono">{window.fmt(total)}원</b> <small>{(vat || 0) > 0 ? '(VAT 포함)' : '(VAT 없음)'}</small></span>
          </div>
        </div>
        <div className="col">
          <div className="inv-party">공 급 자</div>
          <div className="inv-line">
            <span><i>상호</i> <b>{window.BIZ.name}</b></span>
            <span><i>성명</i> {window.BIZ.owner} (인)</span>
            <span><i>사업장</i> {window.BIZ.address}</span>
          </div>
          <div className="inv-line">
            <span><i>전화</i> <span className="mono">{window.BIZ.phone}</span></span>
            <span><i>팩스</i> <span className="mono">{window.BIZ.fax}</span></span>
          </div>
        </div>
      </div>

      <table className="invoice-table">
        <colgroup>
          <col style={{width:'4%'}}/>
          <col style={{width:'30%'}}/>
          <col style={{width:'13.2%'}}/>
          <col style={{width:'13.2%'}}/>
          <col style={{width:'13.2%'}}/>
          <col style={{width:'13.2%'}}/>
          <col style={{width:'13.2%'}}/>
        </colgroup>
        <thead>
          <tr>
            <th>No.</th>
            <th>품 목</th>
            <th>규격</th>
            <th>수량</th>
            <th>단가</th>
            <th>공급가액</th>
            <th>세액</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const it = window.findItem(r.itemId);
            return (
              <tr key={i}>
                <td className="mono">{i + 1}</td>
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
              <td>{rows.length + i + 1}</td><td></td><td></td><td></td><td></td><td></td><td></td>
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
          <div className="lbl">미수금</div>
          <div className="val">{window.fmt(customer?.due || 0)}</div>
        </div>
        <div className="cell">
          <div className="lbl">결제 / 입금계좌</div>
          <div style={{fontSize:12}}><b>농협</b> <span className="mono">352-1981-0292-63</span></div>
          <div className="lbl" style={{marginTop:4}}>예금주: {window.BIZ.owner}</div>
        </div>
      </div>

      <div style={{marginTop:8, fontSize:12, textAlign:'center'}}>
        거래일자 : <b className="mono">{date || window.todayKey()}</b>
      </div>
    </div>
  );
};

const InvoiceModal = ({ data, onClose }) => {
  if (!data) return null;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3><Icons.Print size={16}/> &nbsp; 거래명세서 인쇄 미리보기 (고객용 1장)</h3>
          <div className="modal-actions">
            <button className="btn btn-sm" style={{height:32}} onClick={() => window.print()}><Icons.Print size={14}/> 인쇄</button>
            <button className="icon-btn" onClick={onClose}><Icons.X size={18}/></button>
          </div>
        </div>
        <div className="invoice-print" style={{background:'#E8E2D2', padding:'10px 0'}}>
          <InvoicePage data={data} copy="공급받는자 보관용"/>
        </div>
      </div>
    </div>
  );
};

window.InvoiceModal = InvoiceModal;
