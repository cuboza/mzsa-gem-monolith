import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, Search, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Только уникальные пункты, которых нет в footer
  const navLinks = [
    { path: '/catalog', label: 'Каталог' },
    { path: '/configurator', label: 'Подбор' },
    { path: '/track', label: 'Статус заказа' },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/50 sticky top-0 z-50 transition-colors duration-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center gap-4 h-auto py-4 md:h-20 md:py-0 md:justify-between">
          {/* Логотип */}
          <Link to="/" className="flex items-center mr-8">
            <img 
              src="/images/onr-logo.png" 
              alt="Охота на рыбалку - официальный дилер МЗСА" 
              className="h-10 md:h-12 w-auto dark:brightness-0 dark:invert"
            />
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder="Поиск: лодка 4м, 5 кубов, 2 тонны..."
                className="w-full pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Search size={20} />
              </button>
            </form>
          </div>

          {/* Навигация - всегда видна */}
          <nav className="flex space-x-4 md:space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm md:text-base font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400 ${
                  isActive(link.path) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Телефон и кнопки */}
          <div className="hidden md:flex items-center space-x-4">
            <a href="tel:+73462223355" className="font-bold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center text-sm lg:text-base transition-colors">
              <Phone className="w-4 h-4 mr-1" />
              <span className="hidden lg:inline">+7 (3462) 22-33-55</span>
              <span className="lg:hidden">Позвонить</span>
            </a>
          </div>
          
          {/* Переключатель темы */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
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


    </header>
  );
};

