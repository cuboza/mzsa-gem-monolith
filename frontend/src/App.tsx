import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { Configurator } from './pages/Configurator';
import { TrackOrder } from './pages/TrackOrder';
import { AdminPanel } from './admin/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Админка живет по своему роуту без общего лэйаута */}
        <Route path="/admin/*" element={<AdminPanel />} />

        {/* Основной сайт с шапкой и подвалом */}
        <Route path="*" element={
          <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/configurator" element={<Configurator />} />
                <Route path="/track" element={<TrackOrder />} />
                <Route path="*" element={<div className="p-20 text-center text-2xl">404 - Страница не найдена</div>} />
              </Routes>
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
