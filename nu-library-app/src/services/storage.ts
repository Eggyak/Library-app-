import { UserProfile } from '../types';
import { Api } from './api';

const KEYS = {
  CURRENT_USER: 'nu_lirc_current_user',
  NFC_CARD_ENABLED: 'nu_lirc_nfc_card_enabled'
};

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing ${key} to storage:`, e);
  }
}

export const StorageService = {
  getCurrentUser(): UserProfile | null {
    const apiUser = Api.getStoredUser();
    if (apiUser) {
      return {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role as any,
        enrollmentNo: apiUser.email.split('@')[0].toUpperCase(),
        mobile: '',
        dob: '',
        bloodGroup: '',
        programCode: 'B.Tech CSE',
        session: '2023-2027',
        currentPattern: 'Semester IV',
        fatherName: '',
        fatherMobile: '',
        motherName: '',
        motherMobile: ''
      };
    }
    return getFromStorage<UserProfile | null>(KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: UserProfile | null): void {
    setToStorage(KEYS.CURRENT_USER, user);
  },

  getNfcCardEnabled(): boolean {
    return getFromStorage<boolean>(KEYS.NFC_CARD_ENABLED, true);
  },

  setNfcCardEnabled(enabled: boolean): void {
    setToStorage(KEYS.NFC_CARD_ENABLED, enabled);
  },

  logout(): void {
    Api.logout();
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
};