import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Users, Award, Truck, ShieldCheck } from 'lucide-react';
import { Card, CardFooter } from '../components/ui';

export function About() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-600 to-orange-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              О компании «Охота на рыбалку»
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              Официальный дилер прицепов МЗСА в ХМАО и ЯНАО с 2005 года
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* About Text */}
            <Card padding="lg" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Сеть любимых магазинов охотника и рыболова
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
                <p>
                  Сеть магазинов «Охота на рыбалку» охватывает территорию двух регионов — ХМАО и ЯНАО.
                </p>
                
                <p>
                  Первый магазин «Охота на рыбалку» был открыт в конце сентября 2005 года в городе Ноябрьск. 
                  Затем, спустя всего год, состоялось открытие филиала в Сургуте.
                </p>
                
                <p>
                  К настоящему моменту в составе сети находятся четыре филиала: Сургут, Ноябрьск, 
                  Новый Уренгой (открыт в 2011 году) и Нижневартовск (открыт в 2014 году).
                </p>
                
                <p>
                  Деятельностью нашей сети является торговля продукцией для активного отдыха, 
                  охоты и рыбалки. Каждый магазин сети — это уникальная торговая точка полного цикла, 
                  где любитель отдыха на природе сможет найти практически любой товар под своё увлечение, 
                  от крючка до вездехода.
                </p>
                
                <p>
                  <strong>Мы являемся официальным дилером прицепов МЗСА</strong> — ведущего российского 
                  производителя прицепной техники. В нашем каталоге представлен полный модельный ряд: 
                  бортовые, лодочные и коммерческие прицепы для любых задач.
                </p>
              </div>
            </Card>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card padding="md" className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Официальный дилер МЗСА</h3>
                  <p className="text-gray-600 text-sm">
                    Гарантируем подлинность и качество всех прицепов
                  </p>
                </div>
              </Card>

              <Card padding="md" className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">19 лет на рынке</h3>
                  <p className="text-gray-600 text-sm">
                    Работаем с 2005 года, 4 магазина в регионах ХМАО и ЯНАО
                  </p>
                </div>
              </Card>

              <Card padding="md" className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Бесплатная доставка</h3>
                  <p className="text-gray-600 text-sm">
                    По городу при заказе от 10 000 ₽, доставка по регионам
                  </p>
                </div>
              </Card>

              <Card padding="md" className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Гарантия качества</h3>
                  <p className="text-gray-600 text-sm">
                    Официальная гарантия производителя на все прицепы
                  </p>
                </div>
              </Card>
            </div>

            {/* Stores Preview */}
            <Card padding="lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Наши магазины</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Сургут</h4>
                    <p className="text-gray-600 text-sm">пр-т Мира, 55</p>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" /> 9:00-20:00
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Нижневартовск</h4>
                    <p className="text-gray-600 text-sm">ул. Индустриальная, 11а</p>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" /> 9:00-19:00
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Ноябрьск</h4>
                    <p className="text-gray-600 text-sm">ул. Ленина, 22</p>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" /> 10:00-19:00
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Новый Уренгой</h4>
                    <p className="text-gray-600 text-sm">ул. Таёжная, 75</p>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" /> 10:00-19:00
                    </p>
                  </div>
                </div>
              </div>

              <CardFooter className="flex flex-wrap gap-4">
                <Link 
                  to="/contacts" 
                  className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
                >
                  <Phone className="w-4 h-4" />
                  Все контакты
                </Link>
                <Link 
                  to="/catalog" 
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Перейти в каталог
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
