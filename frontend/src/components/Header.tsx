import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, ShoppingCart, Search, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Блокируем скролл при открытом меню
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Закрываем меню при изменении роута
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  const navLinks = [
    { path: '/catalog', label: 'Каталог' },
    { path: '/configurator', label: 'Конфигуратор' },
    { path: '/track', label: 'Статус заказа' },
    { path: '/about', label: 'О нас' },
    { path: '/contacts', label: 'Контакты' },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center gap-4 h-auto py-4 md:h-20 md:py-0 md:justify-between">
          {/* Логотип */}
          <Link to="/" className="flex flex-col mr-8">
            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
              O-N-R.RU
            </span>
            <span className="text-xs text-gray-500 tracking-wider">
              МЗСА В ХМАО И ЯНАО
            </span>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-xl mx-4">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                placeholder="Поиск: лодка 3.5м, снегоход..."
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
              >
                <Search size={20} />
              </button>
            </form>
          </div>

          {/* Desktop Навигация */}
          <nav className="hidden md:flex space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors hover:text-blue-600 ${
                  isActive(link.path) ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Контакты и кнопки (Desktop) */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <div className="flex flex-col items-end hidden xl:flex">
              <a href="tel:+73467123456" className="font-bold text-gray-800 hover:text-blue-600 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                +7 (3467) 123-45-67
              </a>
              <span className="text-xs text-gray-500">Сургут, ул. Промышленная</span>
            </div>
            <Link 
              to="/configurator"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-md text-sm lg:text-base"
            >
              Подобрать
            </Link>
            
            <Link
              to={user ? "/profile" : "/login"}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/profile') || isActive('/login') 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User size={20} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Поиск: лодка 3.5м..."
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-2.5 text-gray-400">
                <Search size={20} />
              </button>
            </form>
            
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block py-2 font-medium ${
                  isActive(link.path) ? 'text-blue-600' : 'text-gray-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t">
              <Link
                to={user ? "/profile" : "/login"}
                className="flex items-center space-x-2 py-2 font-medium text-gray-700"
                onClick={() => setIsMenuOpen(false)}
              >
                <User size={20} />
                <span>{user ? 'Личный кабинет' : 'Войти'}</span>
              </Link>
              <a href="tel:+73467123456" className="block py-2 font-bold text-gray-800">
                +7 (3467) 123-45-67
              </a>
              <Link 
                to="/configurator"
                className="block w-full bg-orange-500 text-white text-center py-3 rounded-lg font-bold mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Подобрать прицеп
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

