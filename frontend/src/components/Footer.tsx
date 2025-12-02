import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-12 pb-20 md:pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* О компании */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <img 
                src="/images/onr-logo.png" 
                alt="Охота на рыбалку" 
                className="h-12 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Официальный дилер заводов МЗСА в регионах ХМАО и ЯНАО. 
              Продажа, обслуживание и тюнинг прицепов любого назначения.
            </p>
            <div className="flex space-x-4">
              {/* Соцсети можно добавить здесь */}
            </div>
          </div>

          {/* Навигация */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Каталог</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/catalog?cat=general" className="hover:text-white transition-colors">Универсальные прицепы</Link></li>
              <li><Link to="/catalog?cat=water" className="hover:text-white transition-colors">Лодочные прицепы</Link></li>
              <li><Link to="/catalog?cat=commercial" className="hover:text-white transition-colors">Коммерческие</Link></li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Контакты</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-2 flex-shrink-0 text-blue-500" />
                <span>г. Сургут, пр-т Мира, 55</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-2 flex-shrink-0 text-blue-500" />
                <a href="tel:+73462223355" className="hover:text-white">+7 (3462) 22-33-55</a>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-2 flex-shrink-0 text-blue-500" />
                <a href="mailto:info@o-n-r.ru" className="hover:text-white">info@o-n-r.ru</a>
              </li>
              <li className="flex items-start">
                <Clock className="w-5 h-5 mr-2 flex-shrink-0 text-blue-500" />
                <span>9:00 - 20:00<br/>Без выходных</span>
              </li>
            </ul>
          </div>

          {/* Информация */}
          <div>
            <h4 className="font-bold mb-4 text-lg">Информация</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-white">О компании</Link></li>
              <li><Link to="/delivery" className="hover:text-white">Доставка и оплата</Link></li>
              <li><Link to="/warranty" className="hover:text-white">Гарантия</Link></li>
              <li><Link to="/registration" className="hover:text-white">Регистрация прицепа</Link></li>
              <li><Link to="/policy" className="hover:text-white">Политика конфиденциальности</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} O-n-r.ru - Официальный дилер МЗСА. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};
