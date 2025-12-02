/**
 * Сервис для работы с избранным пользователя
 * Хранит в Supabase для авторизованных, в localStorage для гостей
 */

import { supabase } from '../services/api/supabaseClient';

const FAVORITES_KEY = 'mzsa_favorites';

// Типы
export interface FavoriteItem {
  id: string;
  trailerId: string;
  createdAt: string;
}

// Локальное хранилище (для гостей)
const getLocalFavorites = (): string[] => {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setLocalFavorites = (favorites: string[]) => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: favorites }));
};

// Supabase операции
const getSupabaseFavorites = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('trailer_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error loading favorites:', error);
    return [];
  }

  return data?.map(item => item.trailer_id) || [];
};

const addSupabaseFavorite = async (userId: string, trailerId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, trailer_id: trailerId });

  if (error && error.code !== '23505') { // 23505 = unique violation (уже есть)
    console.error('Error adding favorite:', error);
    return false;
  }
  return true;
};

const removeSupabaseFavorite = async (userId: string, trailerId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('trailer_id', trailerId);

  if (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
  return true;
};

// Синхронизация локальных избранных в Supabase при авторизации
export const syncLocalToSupabase = async (userId: string): Promise<void> => {
  const localFavorites = getLocalFavorites();
  
  if (localFavorites.length === 0) return;

  // Добавляем все локальные в Supabase
  const inserts = localFavorites.map(trailerId => ({
    user_id: userId,
    trailer_id: trailerId,
  }));

  const { error } = await supabase
    .from('user_favorites')
    .upsert(inserts, { onConflict: 'user_id,trailer_id' });

  if (error) {
    console.error('Error syncing favorites:', error);
    return;
  }

  // Очищаем локальное хранилище после синхронизации
  localStorage.removeItem(FAVORITES_KEY);
};

// Основные функции API

/**
 * Получить список ID избранных прицепов
 */
export const getFavorites = async (userId?: string): Promise<string[]> => {
  if (userId) {
    return getSupabaseFavorites(userId);
  }
  return getLocalFavorites();
};

/**
 * Получить список ID избранных (синхронная версия для совместимости)
 */
export const getFavoritesSync = (): string[] => {
  return getLocalFavorites();
};

/**
 * Проверить, есть ли прицеп в избранном
 */
export const isFavorite = async (trailerId: string, userId?: string): Promise<boolean> => {
  const favorites = await getFavorites(userId);
  return favorites.includes(trailerId);
};

/**
 * Проверить синхронно (для UI без await)
 */
export const isFavoriteSync = (trailerId: string): boolean => {
  return getLocalFavorites().includes(trailerId);
};

/**
 * Добавить/удалить из избранного
 * @returns true если добавлен, false если удалён
 */
export const toggleFavorite = async (trailerId: string, userId?: string): Promise<boolean> => {
  if (userId) {
    // Авторизованный пользователь - работаем с Supabase
    const favorites = await getSupabaseFavorites(userId);
    const isCurrentlyFavorite = favorites.includes(trailerId);
    
    if (isCurrentlyFavorite) {
      await removeSupabaseFavorite(userId, trailerId);
      window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: favorites.filter(id => id !== trailerId) }));
      return false;
    } else {
      await addSupabaseFavorite(userId, trailerId);
      window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: [...favorites, trailerId] }));
      return true;
    }
  } else {
    // Гость - работаем с localStorage
    const favorites = getLocalFavorites();
    const index = favorites.indexOf(trailerId);
    
    if (index === -1) {
      favorites.push(trailerId);
      setLocalFavorites(favorites);
      return true;
    } else {
      favorites.splice(index, 1);
      setLocalFavorites(favorites);
      return false;
    }
  }
};

/**
 * Синхронный toggle для совместимости (только localStorage)
 */
export const toggleFavoriteSync = (trailerId: string): boolean => {
  const favorites = getLocalFavorites();
  const index = favorites.indexOf(trailerId);
  
  if (index === -1) {
    favorites.push(trailerId);
    setLocalFavorites(favorites);
    return true;
  } else {
    favorites.splice(index, 1);
    setLocalFavorites(favorites);
    return false;
  }
};

/**
 * Очистить все избранные
 */
export const clearFavorites = async (userId?: string): Promise<void> => {
  if (userId) {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing favorites:', error);
    }
  }
  
  localStorage.removeItem(FAVORITES_KEY);
  window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: [] }));
};
