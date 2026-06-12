import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  preferredCurrency?: 'ARS' | 'USD';
  province?: string;
  reputationXP?: number;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * 1. Fetch or initialize a gamer user profile
 */
export async function getOrCreateUserProfile(userId: string, email: string): Promise<UserProfile> {
  const usersCollection = 'users';
  const userPath = `${usersCollection}/${userId}`;
  if (userId.startsWith('user_local_')) {
    try {
      const savedKey = `tgo_user_profile_${userId}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        return JSON.parse(saved) as UserProfile;
      } else {
        const newProfile: UserProfile = {
          userId,
          email,
          displayName: email.split('@')[0],
          preferredCurrency: 'ARS',
          province: 'Capital Federal',
          reputationXP: 100, // Initial gamer starter pack score
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
          updatedAt: { seconds: Math.floor(Date.now() / 1000) }
        };
        localStorage.setItem(savedKey, JSON.stringify(newProfile));
        return newProfile;
      }
    } catch (e) {
      console.error('Error handling mock user profile loads:', e);
    }
  }

  try {
    const docRef = doc(db, usersCollection, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      // Initialize profiles on first registration
      const newProfile: UserProfile = {
        userId,
        email,
        displayName: email.split('@')[0],
        preferredCurrency: 'ARS',
        province: 'Capital Federal',
        reputationXP: 100, // Initial gamer starter pack score
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }
}

/**
 * 2. Real-time gamer profile configuration subscription
 */
export function subscribeUserProfile(userId: string, onUpdate: (profile: UserProfile) => void) {
  const usersCollection = 'users';
  const userPath = `${usersCollection}/${userId}`;
  if (userId.startsWith('user_local_')) {
    const loadProfile = () => {
      try {
        const savedKey = `tgo_user_profile_${userId}`;
        const saved = localStorage.getItem(savedKey);
        if (saved) {
          onUpdate(JSON.parse(saved) as UserProfile);
        }
      } catch (err) {
        console.error('Error reading mock user profile:', err);
      }
    };
    loadProfile();
    const interval = setInterval(loadProfile, 2000);
    return () => clearInterval(interval);
  }

  try {
    const docRef = doc(db, usersCollection, userId);
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as UserProfile);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, userPath);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }
}

/**
 * 3. Update profile preferences
 */
export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  const usersCollection = 'users';
  const userPath = `${usersCollection}/${userId}`;
  if (userId.startsWith('user_local_')) {
    try {
      const savedKey = `tgo_user_profile_${userId}`;
      const saved = localStorage.getItem(savedKey);
      const existing = saved ? JSON.parse(saved) : { userId };
      const updated = {
        ...existing,
        ...data,
        userId,
        updatedAt: { seconds: Math.floor(Date.now() / 1000) }
      };
      localStorage.setItem(savedKey, JSON.stringify(updated));
      return;
    } catch (e) {
      console.error('Error setting mock user profile preference updates:', e);
      return;
    }
  }

  try {
    const docRef = doc(db, usersCollection, userId);
    const payload = {
      ...data,
      userId,
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}
