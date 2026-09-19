// Native IndexedDB storage for custom user audio files
// Allows storing MP3/WAV/AAC audio files up to hundreds of MBs without hitting localStorage's 5MB quota.

const DB_NAME = 'GuessMusicAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_files';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error || new Error('Failed to open IndexedDB'));
    };
  });
}

export async function saveAudioFile(id, fileOrBlob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const data = {
      id: Number(id),
      blob: fileOrBlob,
      name: fileOrBlob.name || `audio-${id}`,
      type: fileOrBlob.type || 'audio/mpeg',
      size: fileOrBlob.size || 0,
      updatedAt: Date.now()
    };
    const req = store.put(data);

    req.onsuccess = () => resolve(data);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getAudioFile(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(Number(id));

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function getAllAudioFiles() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const results = req.result || [];
      const map = {};
      results.forEach(item => {
        map[item.id] = item;
      });
      resolve(map);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteAudioFile(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(Number(id));

    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function clearAllAudioFiles() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve(true);
    req.onerror = (e) => reject(e.target.error);
  });
}
