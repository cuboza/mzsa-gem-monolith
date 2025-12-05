import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid3X3, Settings, Package, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
}

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems: NavItem[] = [
    { 
      path: '/', 
      label: 'Главная', 
      icon: <Home size={22} strokeWidth={1.5} />,
      activeIcon: <Home size={22} strokeWidth={2.5} />
    },
    { 
      path: '/catalog', 
      label: 'Каталог', 
      icon: <Grid3X3 size={22} strokeWidth={1.5} />,
      activeIcon: <Grid3X3 size={22} strokeWidth={2.5} />
    },
    { 
      path: '/configurator', 
      label: 'Подбор', 
      icon: <Settings size={22} strokeWidth={1.5} />,
      activeIcon: <Settings size={22} strokeWidth={2.5} />
    },
    { 
      path: '/track', 
      label: 'Заказ', 
      icon: <Package size={22} strokeWidth={1.5} />,
      activeIcon: <Package size={22} strokeWidth={2.5} />
    },
    { 
      path: user ? '/profile' : '/login', 
      label: user ? 'Профиль' : 'Войти', 
      icon: <User size={22} strokeWidth={1.5} />,
      activeIcon: <User size={22} strokeWidth={2.5} />
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 safe-area-pb transition-colors">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full pt-1 transition-all duration-200 relative group ${
                active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full" />
              )}
              
              {/* Icon with scale animation */}
              <span className={`transition-transform duration-200 ${active ? 'scale-110' : 'group-active:scale-90'}`}>
                {active ? item.activeIcon || item.icon : item.icon}
              </span>
              
              {/* Label */}
              <span className={`text-[10px] mt-1 font-medium transition-colors ${
                active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
