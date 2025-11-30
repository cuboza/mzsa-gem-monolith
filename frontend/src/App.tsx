import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

// Основные страницы загружаются сразу для быстрого LCP
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';

// Остальные страницы загружаются лениво для уменьшения начального бандла
const Configurator = lazy(() => import('./pages/Configurator').then(m => ({ default: m.Configurator })));
const TrackOrder = lazy(() => import('./pages/TrackOrder').then(m => ({ default: m.TrackOrder })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Contacts = lazy(() => import('./pages/Contacts').then(m => ({ default: m.Contacts })));
const Delivery = lazy(() => import('./pages/Delivery').then(m => ({ default: m.Delivery })));
const Warranty = lazy(() => import('./pages/Warranty').then(m => ({ default: m.Warranty })));
const Policy = lazy(() => import('./pages/Policy').then(m => ({ default: m.Policy })));
const AdminPanel = lazy(() => import('./admin/AdminPanel').then(m => ({ default: m.AdminPanel })));

// Компонент загрузки для Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Админка живет по своему роуту без общего лэйаута */}
          <Route path="/admin/*" element={
            <Suspense fallback={<PageLoader />}>
              <AdminPanel />
            </Suspense>
          } />

          {/* Основной сайт с шапкой и подвалом */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/configurator" element={<Configurator />} />
                    <Route path="/track" element={<TrackOrder />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/delivery" element={<Delivery />} />
                    <Route path="/warranty" element={<Warranty />} />
                    <Route path="/policy" element={<Policy />} />
                    <Route path="*" element={<div className="p-20 text-center text-2xl">404 - Страница не найдена</div>} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <MobileBottomNav />
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
