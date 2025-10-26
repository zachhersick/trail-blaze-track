const DB_NAME = 'TrailBlazeOfflineDB';
const DB_VERSION = 1;
const ACTIVITIES_STORE = 'activities';
const TRACKPOINTS_STORE = 'trackpoints';

export interface OfflineActivity {
  id: string;
  user_id: string;
  sport_type: string;
  start_time: string;
  end_time: string;
  total_distance_m: number;
  total_time_s: number;
  moving_time_s: number;
  average_speed_mps: number;
  max_speed_mps: number;
  elevation_gain_m: number;
  elevation_loss_m: number;
  vertical_drop_m: number;
  min_altitude_m: number;
  max_altitude_m: number;
  synced: boolean;
  created_at: string;
}

export interface OfflineTrackpoint {
  id: string;
  activity_id: string;
  latitude: number;
  longitude: number;
  altitude_m: number | null;
  speed_mps: number | null;
  recorded_at: string;
  synced: boolean;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create activities store
        if (!db.objectStoreNames.contains(ACTIVITIES_STORE)) {
          const activityStore = db.createObjectStore(ACTIVITIES_STORE, { keyPath: 'id' });
          activityStore.createIndex('synced', 'synced', { unique: false });
          activityStore.createIndex('user_id', 'user_id', { unique: false });
        }

        // Create trackpoints store
        if (!db.objectStoreNames.contains(TRACKPOINTS_STORE)) {
          const trackpointStore = db.createObjectStore(TRACKPOINTS_STORE, { keyPath: 'id' });
          trackpointStore.createIndex('activity_id', 'activity_id', { unique: false });
          trackpointStore.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
  }

  async saveActivity(activity: OfflineActivity): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ACTIVITIES_STORE], 'readwrite');
      const store = transaction.objectStore(ACTIVITIES_STORE);
      const request = store.put(activity);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveTrackpoint(trackpoint: OfflineTrackpoint): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRACKPOINTS_STORE], 'readwrite');
      const store = transaction.objectStore(TRACKPOINTS_STORE);
      const request = store.put(trackpoint);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedActivities(): Promise<OfflineActivity[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ACTIVITIES_STORE], 'readonly');
      const store = transaction.objectStore(ACTIVITIES_STORE);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedTrackpoints(): Promise<OfflineTrackpoint[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRACKPOINTS_STORE], 'readonly');
      const store = transaction.objectStore(TRACKPOINTS_STORE);
      const index = store.index('synced');
      const request = index.getAll(IDBKeyRange.only(false));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markActivitySynced(activityId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ACTIVITIES_STORE], 'readwrite');
      const store = transaction.objectStore(ACTIVITIES_STORE);
      const getRequest = store.get(activityId);

      getRequest.onsuccess = () => {
        const activity = getRequest.result;
        if (activity) {
          activity.synced = true;
          const putRequest = store.put(activity);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async markTrackpointSynced(trackpointId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([TRACKPOINTS_STORE], 'readwrite');
      const store = transaction.objectStore(TRACKPOINTS_STORE);
      const getRequest = store.get(trackpointId);

      getRequest.onsuccess = () => {
        const trackpoint = getRequest.result;
        if (trackpoint) {
          trackpoint.synced = true;
          const putRequest = store.put(trackpoint);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteActivity(activityId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ACTIVITIES_STORE], 'readwrite');
      const store = transaction.objectStore(ACTIVITIES_STORE);
      const request = store.delete(activityId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
