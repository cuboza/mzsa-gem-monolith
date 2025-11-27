import { useNavigate } from 'react-router-dom';
import { Settings, Award, MapPin, Phone, Clock, ExternalLink, Shield } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();

  const advantages = [
    {
      icon: <Award className="w-8 h-8 text-white" />,
      title: "Партнер завода",
      desc: "15 лет"
    },
    {
      icon: <MapPin className="w-8 h-8 text-white" />,
      title: "В наличии",
      desc: "В 4-х городах"
    },
    {
      icon: <Shield className="w-8 h-8 text-white" />,
      title: "Гарантия 1 год",
      desc: "От производителя"
    },
    {
      icon: <Settings className="w-8 h-8 text-white" />,
      title: "Аксессуары",
      desc: "Выбор опций"
    }
  ];

  const stores = [
    {
      city: "Сургут",
      address: "пр-т Мира, 55",
      phone: "+7 (3462) 22-33-55",
      hours: "9:00-20:00",
      mapUrl: "https://yandex.ru/maps/-/CHEiV6wh"
    },
    {
      city: "Нижневартовск",
      address: "ул. Индустриальная, 11а",
      phone: "+7 (3466) 62-54-20",
      hours: "9:00-19:00",
      mapUrl: "https://yandex.ru/maps/-/CHEiVCsN"
    },
    {
      city: "Ноябрьск",
      address: "ул. Ленина, 22",
      phone: "+7 (3496) 42-46-14",
      hours: "10:00-19:00",
      mapUrl: "https://yandex.ru/maps/-/CHEiVC8R"
    },
    {
      city: "Новый Уренгой",
      address: "ул. Таежная, 75",
      phone: "+7 (3494) 22-21-82",
      hours: "10:00-19:00",
      mapUrl: "https://yandex.ru/maps/-/CHEiVGzJ"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-900 text-white pt-24 pb-16 overflow-hidden">
        {/* Декоративный фон */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-1 mb-6 border border-white/20">
              <MapPin className="w-4 h-4 mr-2 text-orange-400" />
              <span className="text-sm font-medium">Официальный дилер МЗСА в ХМАО и ЯНАО</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Надежные прицепы <br/>
              <span className="text-orange-400">
                для любых задач
              </span>
            </h1>
            
            <p className="text-lg md:text-xl mb-10 text-blue-100 max-w-2xl mx-auto">
              Более 40 моделей в наличии. От простых дачных до профессиональных эвакуаторов и лодочных прицепов.
            </p>

            {/* Кнопки */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                onClick={() => navigate('/configurator')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 flex items-center justify-center transition-all transform hover:scale-105"
              >
                <Settings className="w-6 h-6 mr-2" />
                Подобрать прицеп
              </button>
              <button 
                onClick={() => navigate('/catalog')}
                className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center transition-all"
              >
                Смотреть каталог
              </button>
            </div>

            {/* Преимущества */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {advantages.map((adv, idx) => (
                <div key={idx} className="bg-orange-500 rounded-xl p-4 flex flex-col items-center text-center hover:bg-orange-600 transition-colors shadow-lg">
                  <div className="mb-3 bg-white/20 p-2 rounded-lg">
                    {adv.icon}
                  </div>
                  <p className="text-sm font-bold text-white">{adv.title}</p>
                  <p className="text-xs text-orange-100">{adv.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Категории (быстрый доступ) */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Популярные категории</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div 
              onClick={() => navigate('/catalog?cat=general')}
              className="group cursor-pointer relative h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <img 
                src="/images/categories/general.jpg" 
                alt="Универсальные прицепы" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 lg:p-8 z-20 text-white">
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1" style={{textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)'}}>Универсальные</h3>
                <p className="text-base md:text-lg" style={{textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)'}}>Для мототехники и грузов</p>
              </div>
            </div>

            <div 
              onClick={() => navigate('/catalog?cat=water')}
              className="group cursor-pointer relative h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <img 
                src="/images/categories/water.jpg" 
                alt="Лодочные прицепы" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 lg:p-8 z-20 text-white">
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1" style={{textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)'}}>Лодочные</h3>
                <p className="text-base md:text-lg" style={{textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)'}}>Для лодок, катеров, гидроциклов</p>
              </div>
            </div>

            <div 
              onClick={() => navigate('/catalog?cat=commercial')}
              className="group cursor-pointer relative h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <img 
                src="/images/categories/commercial.jpg" 
                alt="Коммерческие прицепы" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 lg:p-8 z-20 text-white">
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1" style={{textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)'}}>Коммерческие</h3>
                <p className="text-base md:text-lg" style={{textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 4px rgba(0,0,0,0.8)'}}>Фургоны и эвакуаторы</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Статистика/Счётчики */}
      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">65+</div>
              <div className="text-sm text-blue-200">Моделей прицепов</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">136</div>
              <div className="text-sm text-blue-200">Аксессуаров</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">15</div>
              <div className="text-sm text-blue-200">Лет на рынке</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">4</div>
              <div className="text-sm text-blue-200">Города присутствия</div>
            </div>
          </div>
        </div>
      </section>

      {/* Наши магазины */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <a href="https://o-n-r.ru" target="_blank" rel="noopener noreferrer" className="inline-block mb-4">
              <img src="/images/onr-logo.png" alt="Охота на рыбалку" className="h-16 mx-auto hover:opacity-80 transition-opacity" />
            </a>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Наши магазины</h2>
            <p className="text-gray-600">Сеть магазинов «Охота на рыбалку» — официальный дилер МЗСА в ХМАО и ЯНАО</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {stores.map((store, idx) => (
              <div 
                key={idx} 
                className="bg-gray-50 rounded-xl p-5 hover:shadow-lg transition-shadow border border-gray-100"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">{store.city}</h3>
                
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{store.address}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <a href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} className="text-gray-700 hover:text-blue-600">
                      {store.phone}
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="text-gray-700">{store.hours}</span>
                  </div>
                </div>

                <a 
                  href={store.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Показать на карте
                </a>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a 
              href="https://o-n-r.ru/contacts/stores/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Все магазины на сайте o-n-r.ru
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

