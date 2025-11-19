import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, ShoppingCart, Search } from 'lucide-react';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
        <div className="flex justify-between items-center h-20">
          {/* Логотип */}
          <Link to="/" className="flex flex-col">
            <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
              O-N-R.RU
            </span>
            <span className="text-xs text-gray-500 tracking-wider">
              МЗСА В ХМАО И ЯНАО
            </span>
          </Link>

          {/* Desktop Навигация */}
          <nav className="hidden md:flex space-x-8">
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
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex flex-col items-end">
              <a href="tel:+73467123456" className="font-bold text-gray-800 hover:text-blue-600 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                +7 (3467) 123-45-67
              </a>
              <span className="text-xs text-gray-500">Сургут, ул. Промышленная</span>
            </div>
            <Link 
              to="/configurator"
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-md"
            >
              Подобрать прицеп
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

