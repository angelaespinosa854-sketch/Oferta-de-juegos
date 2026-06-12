import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp, 
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export interface AlertData {
  gameTitle: string;
  platform: string;
  targetPriceUsd?: number;
  targetPriceArs?: number;
  discountPercentThreshold?: number;
}

export interface FirestoreAlert extends AlertData {
  id: string;
  userId: string;
  createdAt: any;
}

/**
 * 1. Add a new price alert to the radar
 */
export async function addAlert(userId: string, alertData: AlertData): Promise<string> {
  const alertsCollection = 'alerts';
  if (userId.startsWith('user_local_')) {
    const id = 'alert_local_' + Math.random().toString(36).substring(2, 11);
    const newAlert: FirestoreAlert = {
      ...alertData,
      id,
      userId,
      createdAt: { seconds: Math.floor(Date.now() / 1000) }
    };
    try {
      const saved = localStorage.getItem('tgo_user_alerts_mock_v1');
      const list = saved ? JSON.parse(saved) : [];
      list.push(newAlert);
      localStorage.setItem('tgo_user_alerts_mock_v1', JSON.stringify(list));
      // Dispatch storage event to notify other listeners on the same page
      window.dispatchEvent(new Event('storage'));
      return id;
    } catch (e) {
      console.error('Error saving local mock alert:', e);
      return id;
    }
  }

  try {
    // Generate a secure custom document ID or let Firestore generate it
    const newDocRef = doc(collection(db, alertsCollection));
    const payload = {
      ...alertData,
      id: newDocRef.id,
      userId,
      createdAt: serverTimestamp() // Mandatory Temporal Integrity
    };

    await setDoc(newDocRef, payload);
    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, alertsCollection);
  }
}

/**
 * 2. Subscribe to user's alerts in real time
 */
export function subscribeUserAlerts(userId: string, onUpdate: (alerts: FirestoreAlert[]) => void, onError?: (err: Error) => void) {
  const alertsCollection = 'alerts';
  if (userId.startsWith('user_local_')) {
    const loadLocal = () => {
      try {
        const saved = localStorage.getItem('tgo_user_alerts_mock_v1');
        const list = saved ? JSON.parse(saved) : [];
        const userAlerts = list.filter((a: any) => a.userId === userId);
        onUpdate(userAlerts);
      } catch (err) {
        console.error('Error loading mock alerts:', err);
      }
    };
    
    loadLocal();
    window.addEventListener('storage', loadLocal);
    const interval = setInterval(loadLocal, 1000);
    return () => {
      window.removeEventListener('storage', loadLocal);
      clearInterval(interval);
    };
  }

  try {
    const alertsQuery = query(
      collection(db, alertsCollection), 
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      alertsQuery, 
      (snapshot) => {
        const list: FirestoreAlert[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            userId: data.userId,
            gameTitle: data.gameTitle,
            platform: data.platform,
            targetPriceUsd: data.targetPriceUsd,
            targetPriceArs: data.targetPriceArs,
            discountPercentThreshold: data.discountPercentThreshold,
            createdAt: data.createdAt
          });
        });
        onUpdate(list);
      }, 
      (error) => {
        handleFirestoreError(error, OperationType.GET, alertsCollection);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, alertsCollection);
  }
}

/**
 * 3. Delete an existing alert from the radar
 */
export async function deleteAlert(alertId: string): Promise<void> {
  const alertsPath = `alerts/${alertId}`;
  if (alertId.startsWith('alert_local_')) {
    try {
      const saved = localStorage.getItem('tgo_user_alerts_mock_v1');
      if (saved) {
        const list = JSON.parse(saved);
        const filtered = list.filter((a: any) => a.id !== alertId);
        localStorage.setItem('tgo_user_alerts_mock_v1', JSON.stringify(filtered));
        // Dispatch storage event to notify other listeners on the same page
        window.dispatchEvent(new Event('storage'));
      }
      return;
    } catch (e) {
      console.error('Error deleting local mock alert:', e);
      return;
    }
  }

  try {
    const alertRef = doc(db, 'alerts', alertId);
    await deleteDoc(alertRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, alertsPath);
  }
}
