import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { Configurator } from './pages/Configurator';
import { TrackOrder } from './pages/TrackOrder';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { About } from './pages/About';
import { Contacts } from './pages/Contacts';
import { Delivery } from './pages/Delivery';
import { Warranty } from './pages/Warranty';
import { Policy } from './pages/Policy';
import { AdminPanel } from './admin/AdminPanel';

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Админка живет по своему роуту без общего лэйаута */}
          <Route path="/admin/*" element={<AdminPanel />} />

          {/* Основной сайт с шапкой и подвалом */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200">
              <Header />
              <main className="flex-grow">
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