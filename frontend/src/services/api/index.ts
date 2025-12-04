import { IDatabaseProvider } from './interface';
import { LocalStorageProvider } from './localStorageProvider';
import { RestProvider } from './restProvider';
import { SupabaseProvider } from './supabaseProvider';

// Переключатель провайдера данных через env-переменную
// 'local' - LocalStorage (браузер) — по умолчанию для разработки
// 'rest' - JSON Server (http://localhost:3001)
// 'supabase' - Supabase (облако) — для продакшена
type DataSourceType = 'local' | 'rest' | 'supabase';
const DATA_SOURCE: DataSourceType = (import.meta.env.VITE_DATA_SOURCE as DataSourceType) || 'local'; 

class DatabaseFactory {
  private static instance: IDatabaseProvider;

  public static getInstance(): IDatabaseProvider {
    if (!DatabaseFactory.instance) {
      if (DATA_SOURCE === 'supabase') {
        // SupabaseProvider - это объект, не класс
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

