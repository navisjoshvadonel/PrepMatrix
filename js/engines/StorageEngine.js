// js/engines/StorageEngine.js
/**
 * StorageEngine — simple persistence layer using browser localStorage.
 * Stores student session data (skill scores, selected company, timestamps)
 * and can retrieve it on app load.
 *
 * Data schema:
 *   {
 *     skillScores: number[],
 *     company: string,
 *     timestamp: number (ms since epoch)
 *   }
 */
export class StorageEngine {
  constructor(storageKey = 'prepMatrixSession') {
    this.storageKey = storageKey;
  }

  /** Save session data to localStorage */
  save(sessionData) {
    try {
      const payload = {
        ...sessionData,
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(payload));
      console.log('[StorageEngine] Session saved');
    } catch (e) {
      console.error('[StorageEngine] Failed to save session', e);
    }
  }

  /** Load session data if present */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      console.log('[StorageEngine] Session loaded');
      return data;
    } catch (e) {
      console.error('[StorageEngine] Failed to load session', e);
      return null;
    }
  }

  /** Clear persisted session */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('[StorageEngine] Session cleared');
    } catch (e) {
      console.error('[StorageEngine] Failed to clear session', e);
    }
  }
}
