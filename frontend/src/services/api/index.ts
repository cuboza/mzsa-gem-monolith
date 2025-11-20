import { IDatabaseProvider } from './interface';
import { LocalStorageProvider } from './localStorageProvider';
import { RestProvider } from './restProvider';

// Переключатель провайдера данных
// 'local' - LocalStorage (браузер)
// 'rest' - JSON Server (http://localhost:3001)
const DATA_SOURCE: 'local' | 'rest' = 'rest'; 

class DatabaseFactory {
  private static instance: IDatabaseProvider;

  public static getInstance(): IDatabaseProvider {
    if (!DatabaseFactory.instance) {
      if (DATA_SOURCE === 'rest') {
        DatabaseFactory.instance = new RestProvider();
      } else {
        DatabaseFactory.instance = new LocalStorageProvider();
      }
    }
    return DatabaseFactory.instance;
  }
}

export const db = DatabaseFactory.getInstance();

