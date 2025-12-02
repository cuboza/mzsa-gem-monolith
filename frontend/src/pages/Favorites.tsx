import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ArrowLeft } from 'lucide-react';
import { Trailer } from '../types';
import { TrailerCard } from '../components/TrailerCard';
import { TrailerDetailsModal } from '../components/TrailerDetailsModal';
import { useAuth } from '../context/AuthContext';
import { 
  getFavorites, 
  getFavoritesSync,
  toggleFavorite as toggleFavoriteService, 
  toggleFavoriteSync,
  clearFavorites,
  isFavoriteSync,
  syncLocalToSupabase 
} from '../services/favorites';

// Экспортируем синхронные версии для совместимости с TrailerCard и Header
export { getFavoritesSync as getFavorites, toggleFavoriteSync as toggleFavorite, isFavoriteSync as isFavorite };

export const Favorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true);
      
      // Если пользователь авторизовался, синхронизируем локальные избранные
      if (user?.id) {
        await syncLocalToSupabase(user.id);
      }
      
      const favoriteIds = await getFavorites(user?.id);
      setFavorites(favoriteIds);
      
      if (favoriteIds.length > 0) {
        // Загружаем данные о прицепах из API
        const { db } = await import('../services/api');
        const allTrailers = await db.getTrailers();
        const favoriteTrailers = allTrailers.filter(t => favoriteIds.includes(t.id));
        setTrailers(favoriteTrailers);
      } else {
        setTrailers([]);
      }
      
      setLoading(false);
    };

    loadFavorites();

    // Слушаем изменения избранного
    const handleFavoritesChanged = (e: CustomEvent<string[]>) => {
      setFavorites(e.detail);
      loadFavorites();
    };

    window.addEventListener('favoritesChanged', handleFavoritesChanged as EventListener);
    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChanged as EventListener);
    };
  }, [user?.id]);

  const handleRemove = async (trailerId: string) => {
    await toggleFavoriteService(trailerId, user?.id);
  };

  const handleClearAll = async () => {
    await clearFavorites(user?.id);
    setFavorites([]);
    setTrailers([]);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link 
            to="/catalog" 
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-7 h-7 text-red-500" />
            Избранное
          </h1>
          {trailers.length > 0 && (
            <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full text-sm font-medium">
              {trailers.length}
            </span>
          )}
        </div>

        {trailers.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Очистить</span>
          </button>
        )}
      </div>

      {/* Контент */}
      {trailers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 sm:p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            В избранном пусто
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Добавляйте понравившиеся прицепы, нажимая на сердечко в каталоге
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {trailers.map(trailer => (
            <div key={trailer.id} className="relative group">
              <TrailerCard 
                trailer={trailer} 
                onClick={() => setSelectedTrailer(trailer)}
              />
              <button
                onClick={() => handleRemove(trailer.id)}
                className="absolute top-2 right-2 z-10 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                title="Удалить из избранного"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно деталей прицепа */}
      {selectedTrailer && (
        <TrailerDetailsModal
          trailer={selectedTrailer}
          onClose={() => setSelectedTrailer(null)}
        />
      )}
    </div>
  );
};
