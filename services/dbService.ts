import { Question, UserAnswer, Bookmark, PlannerTask, TopicAnalytics, TestPlan } from '../types';

const DB_NAME = 'NEETPrepAIDB';
const DB_VERSION = 1;

export const STORES = {
    questions: 'questions',
    userAnswers: 'userAnswers',
    bookmarks: 'bookmarks',
    tasks: 'tasks',
    topicAnalytics: 'topicAnalytics',
    testPlans: 'testPlans',
    kvStore: 'kvStore', // For simple key-value pairs
};

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("IndexedDB error:", request.error);
            reject("IndexedDB error");
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORES.questions)) {
                db.createObjectStore(STORES.questions, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.userAnswers)) {
                db.createObjectStore(STORES.userAnswers, { autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(STORES.bookmarks)) {
                db.createObjectStore(STORES.bookmarks, { keyPath: 'questionId' });
            }
            if (!db.objectStoreNames.contains(STORES.tasks)) {
                db.createObjectStore(STORES.tasks, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.topicAnalytics)) {
                // Using the topic string as the key, so no keyPath
                db.createObjectStore(STORES.topicAnalytics);
            }
            if (!db.objectStoreNames.contains(STORES.testPlans)) {
                db.createObjectStore(STORES.testPlans, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.kvStore)) {
                db.createObjectStore(STORES.kvStore, { keyPath: 'key' });
            }
        };
    });
};

const getStore = (storeName: string, mode: IDBTransactionMode) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

// Generic Functions
export const getAll = <T>(storeName: string): Promise<T[]> => {
    return new Promise(async (resolve, reject) => {
        await openDB();
        const store = getStore(storeName, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getKeyValue = <T>(key: string): Promise<T | undefined> => {
    return new Promise(async (resolve, reject) => {
        await openDB();
        const store = getStore(STORES.kvStore, 'readonly');
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result?.value);
        request.onerror = () => reject(request.error);
    });
};

export const setKeyValue = <T>(key: string, value: T): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        await openDB();
        const store = getStore(STORES.kvStore, 'readwrite');
        const request = store.put({ key, value });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getTopicAnalytics = (): Promise<TopicAnalytics> => {
    return new Promise(async (resolve, reject) => {
        await openDB();
        const store = getStore(STORES.topicAnalytics, 'readonly');
        const analytics: TopicAnalytics = {};
        const request = store.openCursor();
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                analytics[cursor.key as string] = cursor.value;
                cursor.continue();
            } else {
                resolve(analytics);
            }
        };
        request.onerror = () => reject(request.error);
    });
};

export const setTopicAnalyticsData = (key: string, data: any): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        await openDB();
        const store = getStore(STORES.topicAnalytics, 'readwrite');
        const request = store.put(data, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const addMany = <T>(storeName: string, items: T[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        if (items.length === 0) return resolve();
        await openDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        items.forEach(item => store.add(item));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const putOne = <T>(storeName: string, item: T): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        await openDB();
        const store = getStore(storeName, 'readwrite');
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteOne = (storeName: string, key: IDBValidKey): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        await openDB();
        const store = getStore(storeName, 'readwrite');
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
