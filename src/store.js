// Persistence layer — uses Electron IPC when available, falls back to localStorage
(function () {
  // SCHEMA_VERSION: 현재 데이터 형식 버전.
  //  - v1: 옛 샘플 전용 빌드 → 일회성 폐기(샘플만 들어 있었음)
  //  - v2+ : 실데이터. 업데이트해도 절대 초기화하지 않고,
  //          부족한 필드만 기본값으로 채우는 보존형 마이그레이션.
  const SCHEMA_VERSION = 2;
  const LS_KEY = 'saeipari.db.v1';

  const hasElectron = !!(window.saeipari && window.saeipari.load);

  // 기존 데이터를 보존하면서 누락 필드만 채움 (업데이트 시 데이터 안전)
  function migrate(data, seedFactory) {
    const base = seedFactory(); // 모든 키 + 기본값을 가진 빈 템플릿
    for (const k of Object.keys(base)) {
      if (data[k] === undefined) data[k] = base[k];
    }
    if (!Array.isArray(data.trayPresets)) {
      data.trayPresets = (window.DEFAULT_TRAY_PRESETS || base.trayPresets || []).slice();
    }
    // 레코드별 누락 필드 보정 (구버전 레코드가 새 필드를 안전하게 가지도록)
    (data.items || []).forEach(i => {
      if (i.useCount == null) i.useCount = 0;
      if (i.stock == null) i.stock = 0;
      if (i.safety == null) i.safety = 0;
      if (!i.initials && i.name && window.getInitials) i.initials = window.getInitials(i.name);
    });
    (data.customers || []).forEach(c => { if (c.due == null) c.due = 0; });
    (data.transactions || []).forEach(t => { if (t.paid == null) t.paid = 0; if (!Array.isArray(t.lines)) t.lines = []; });
    // 다음 ID는 기존 최대값 이상으로 보정 (충돌 방지)
    const maxId = (arr) => (arr && arr.length) ? Math.max(...arr.map(x => x.id || 0)) : 0;
    data.nextCustomerId = Math.max(data.nextCustomerId || 1, maxId(data.customers) + 1);
    data.nextItemId = Math.max(data.nextItemId || 1, maxId(data.items) + 1);
    data.nextTransactionId = Math.max(data.nextTransactionId || 1, maxId(data.transactions) + 1);
    data.nextSowingId = Math.max(data.nextSowingId || 1, maxId(data.sowings) + 1);
    data.schemaVersion = SCHEMA_VERSION;
    return data;
  }

  const Store = {
    state: null,

    async init(seedFactory) {
      let data = null;
      if (hasElectron) {
        try { data = await window.saeipari.load(); } catch (e) { console.warn('load failed', e); }
      } else {
        try {
          const raw = localStorage.getItem(LS_KEY);
          if (raw) data = JSON.parse(raw);
        } catch {}
      }
      if (!data) {
        // 최초 실행 → 빈 상태로 시작
        data = seedFactory();
        data.schemaVersion = SCHEMA_VERSION;
        await this._persist(data);
      } else if (data.schemaVersion === 1) {
        // 옛 샘플 전용 빌드 → 일회성 폐기 (v1에는 샘플 데이터만 존재)
        data = seedFactory();
        data.schemaVersion = SCHEMA_VERSION;
        await this._persist(data);
      } else {
        // v2+ (또는 버전 없는 실데이터) → 보존형 마이그레이션
        data = migrate(data, seedFactory);
        await this._persist(data);
      }
      this.state = data;
      return data;
    },

    async _persist(data) {
      if (hasElectron) {
        try { await window.saeipari.save(data); } catch (e) { console.error('save failed', e); }
      } else {
        try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (e) { console.error('localStorage save', e); }
      }
    },

    async commit() {
      this.state.lastSaved = new Date().toISOString();
      await this._persist(this.state);
    },

    async backup() {
      if (hasElectron) {
        try { return await window.saeipari.backup(); } catch (e) { return null; }
      }
      return null;
    },

    async exportJSON(name) {
      const content = JSON.stringify(this.state, null, 2);
      if (hasElectron) {
        try { return await window.saeipari.exportFile({ suggestedName: name || 'saeipari-export.json', content }); } catch { return null; }
      }
      // browser fallback: download
      const blob = new Blob([content], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name || 'saeipari-export.json';
      a.click();
      return name;
    },

    async paths() {
      if (hasElectron) {
        try { return await window.saeipari.paths(); } catch { return null; }
      }
      return null;
    }
  };

  window.Store = Store;
  window.IS_ELECTRON = hasElectron;
})();
