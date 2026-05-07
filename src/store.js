// Persistence layer — uses Electron IPC when available, falls back to localStorage
(function () {
  const SCHEMA_VERSION = 1;
  const LS_KEY = 'saeipari.db.v1';

  const hasElectron = !!(window.saeipari && window.saeipari.load);

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
      if (!data || !data.schemaVersion) {
        data = seedFactory();
        data.schemaVersion = SCHEMA_VERSION;
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
