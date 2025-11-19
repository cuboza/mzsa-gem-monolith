import { IDatabaseProvider } from './interface';
import { LocalStorageProvider } from './localStorageProvider';

// Здесь можно будет переключиться на FirebaseProvider в будущем
// const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

class DatabaseFactory {
  private static instance: IDatabaseProvider;

  public static getInstance(): IDatabaseProvider {
    if (!DatabaseFactory.instance) {
      // if (USE_FIREBASE) {
      //   DatabaseFactory.instance = new FirebaseProvider();
      // } else {
        DatabaseFactory.instance = new LocalStorageProvider();
      // }
    }
    return DatabaseFactory.instance;
  }
}

export const db = DatabaseFactory.getInstance();

