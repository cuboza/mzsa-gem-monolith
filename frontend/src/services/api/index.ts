import { IDatabaseProvider } from './interface';
import { LocalStorageProvider } from './localStorageProvider';
import { RestProvider } from './restProvider';
import { SupabaseProvider } from './supabaseProvider';

// Переключатель провайдера данных
// 'local' - LocalStorage (браузер)
// 'rest' - JSON Server (http://localhost:3001)
// 'supabase' - Supabase (облако)
const DATA_SOURCE: 'local' | 'rest' | 'supabase' = 'supabase'; 

class DatabaseFactory {
  private static instance: IDatabaseProvider;

  public static getInstance(): IDatabaseProvider {
    if (!DatabaseFactory.instance) {
      if (DATA_SOURCE === 'supabase') {
        DatabaseFactory.instance = SupabaseProvider;
      } else if (DATA_SOURCE === 'rest') {
        DatabaseFactory.instance = new RestProvider();
      } else {
        DatabaseFactory.instance = new LocalStorageProvider();
      }
    }
    return DatabaseFactory.instance;
  }
}

export const db = DatabaseFactory.getInstance();

