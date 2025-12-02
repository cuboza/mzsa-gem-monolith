import { Link, useLocation } from 'react-router-dom';
import { User, Sun, Moon, FileText, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CitySelector } from './ui';
import { getFavorites } from '../pages/Favorites';

export const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [favoritesCount, setFavoritesCount] = useState(() => getFavorites().length);

  // Слушаем изменения избранного
  useEffect(() => {
    const handleFavoritesChanged = () => {
      setFavoritesCount(getFavorites().length);
    };
    window.addEventListener('favoritesChanged', handleFavoritesChanged);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChanged);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50 sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <Link to="/" className="flex items-center">
            <img 
              src="/images/onr-logo.png" 
              alt="Охота на рыбалку - официальный дилер МЗСА" 
              className="h-10 w-auto dark:brightness-0 dark:invert dark:opacity-90"
            />
          </Link>

          {/* Навигация и иконки */}
          <div className="flex items-center space-x-2">
            {/* Выбор города */}
            <CitySelector className="hidden sm:block" />
            <CitySelector variant="compact" className="sm:hidden" />
            
            <Link
              to="/registration"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/registration')
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FileText size={18} />
              <span>Регистрация прицепа</span>
            </Link>
            <Link
              to="/registration"
              className={`sm:hidden p-2 rounded-lg transition-colors ${
                isActive('/registration')
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Регистрация прицепа"
            >
              <FileText size={20} />
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Link
              to="/favorites"
              className={`relative p-2 rounded-lg transition-colors ${
                isActive('/favorites')
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title="Избранное"
            >
              <Heart size={20} />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                  {favoritesCount > 9 ? '9+' : favoritesCount}
                </span>
              )}
            </Link>
            
            <Link
              to={user ? "/profile" : "/login"}
              className={`p-2 rounded-lg transition-colors ${
                isActive('/profile') || isActive('/login') 
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <User size={20} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
