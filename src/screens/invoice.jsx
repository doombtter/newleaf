// 거래명세서 인쇄 미리보기
const InvoicePage = ({ data, copy }) => {
  const { customer, date, rows, subtotal, vat, total } = data;
  const exBoxTotal = (data.exBoxTotal != null) ? data.exBoxTotal : (data.total != null ? data.total : subtotal);
  const prevDue = (data.prevDue != null) ? data.prevDue : (customer?.due || 0);
  const boxCount = data.boxCount || 0;
  const totalQty = rows.reduce((a, r) => a + (Number(r.qty) || 0), 0);

  return (
    <div className="invoice-page">
      <div className="invoice-title">거 래 명 세 표 <span className="invoice-copy">({copy})</span></div>

      <table className="inv-head">
        <colgroup>
          <col style={{width:'3%'}}/>
          <col style={{width:'9%'}}/>
          <col style={{width:'25%'}}/>
          <col style={{width:'3%'}}/>
          <col style={{width:'9%'}}/>
          <col style={{width:'21%'}}/>
          <col style={{width:'8%'}}/>
          <col style={{width:'22%'}}/>
        </colgroup>
        <tbody>
          <tr>
            <td className="side" rowSpan={4}>공<br/>급<br/>받<br/>는<br/>자</td>
            <td className="lab">상호<br/>(법인명)</td>
            <td className="val nm">{customer?.name || ''}</td>
            <td className="side" rowSpan={4}>공<br/>급<br/>자</td>
            <td className="lab">등록번호</td>
            <td className="val reg" colSpan={3}>{window.BIZ.bizNo}</td>
          </tr>
          <tr>
            <td className="lab">사업장<br/>주소</td>
            <td className="val">{customer?.address || ''}</td>
            <td className="lab">상호<br/>(법인명)</td>
            <td className="val nm">{window.BIZ.name}</td>
            <td className="lab">성명</td>
            <td className="val">{window.BIZ.owner} (인)</td>
          </tr>
          <tr>
            <td className="lab">전화번호</td>
            <td className="val mono">{customer?.phone || ''}</td>
            <td className="lab">사업장<br/>주소</td>
            <td className="val" colSpan={3}>{window.BIZ.address}</td>
          </tr>
          <tr>
            <td className="lab">합계금액<br/><small>{(vat || 0) > 0 ? '(VAT포함)' : '(VAT없음)'}</small></td>
            <td className="val amt mono">{window.fmt(total)}원</td>
            <td className="lab">전화</td>
            <td className="val mono">{window.BIZ.phone}</td>
            <td className="lab">팩스</td>
            <td className="val mono">{window.BIZ.fax}</td>
          </tr>
        </tbody>
      </table>

      <div className="invoice-date">거래일자 : <b className="mono">{date || window.todayKey()}</b></div>

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
          {rows.length === 0 && (
            <tr className="empty"><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
          )}
        </tbody>
      </table>

      <div className="invoice-foot">
        <div className="cell">
          <div className="lbl">상자외 합계{boxCount > 0 ? ` (상자 ${boxCount}개 공제)` : ''}</div>
          <div className="val">{window.fmt(exBoxTotal)}</div>
        </div>
        <div className="cell">
          <div className="lbl">미수금 (이전까지)</div>
          <div className="val">{window.fmt(prevDue)}</div>
        </div>
        <div className="cell">
          <div className="lbl">결제 / 입금계좌</div>
          <div style={{fontSize:14}}><b>농협</b> <span className="mono acct">352-1981-0292-63</span></div>
          <div className="lbl" style={{marginTop:4}}>예금주: {window.BIZ.owner}</div>
        </div>
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
