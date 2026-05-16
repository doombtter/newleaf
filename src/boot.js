// 데이터 로드 후 앱 렌더 (사전 컴파일된 app.bundle.js 사용)
(async function () {
  try {
    await window.Store.init(window.seedFactory);
    window.__renderApp();
  } catch (e) {
    document.getElementById('app').innerHTML =
      '<div style="padding:60px; font-family:sans-serif; color:#B0322C;"><h2>로드 실패</h2><pre>' +
      (e && e.stack ? e.stack : String(e)) + '</pre></div>';
    console.error(e);
  }
})();
