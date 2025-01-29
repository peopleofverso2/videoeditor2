import { openDB } from 'idb';

const DB_NAME = 'video-editor-db';
const DB_VERSION = 1;
const VIDEO_STORE = 'videos';
const METADATA_STORE = 'metadata';

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store pour les vidéos
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE);
      }
      // Store pour les métadonnées
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE);
      }
    },
  });
}

export async function storeVideo(id, videoBlob, metadata) {
  const db = await initDB();
  const tx = db.transaction([VIDEO_STORE, METADATA_STORE], 'readwrite');
  
  await Promise.all([
    tx.objectStore(VIDEO_STORE).put(videoBlob, id),
    tx.objectStore(METADATA_STORE).put(metadata, id),
    tx.done,
  ]);
}

export async function getVideo(id) {
  const db = await initDB();
  return db.get(VIDEO_STORE, id);
}

export async function getMetadata(id) {
  const db = await initDB();
  return db.get(METADATA_STORE, id);
}

export async function removeVideo(id) {
  const db = await initDB();
  const tx = db.transaction([VIDEO_STORE, METADATA_STORE], 'readwrite');
  
  await Promise.all([
    tx.objectStore(VIDEO_STORE).delete(id),
    tx.objectStore(METADATA_STORE).delete(id),
    tx.done,
  ]);
}

export async function getAllMetadata() {
  const db = await initDB();
  return db.getAll(METADATA_STORE);
}
