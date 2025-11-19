import { useNavigate } from 'react-router-dom';
import { Settings, Award, MapPin, CheckCircle, Truck, Shield } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();

  const advantages = [
    {
      icon: <Award className="w-8 h-8 text-white" />,
      title: "Лидер отрасли",
      desc: "ТОП-10 в Европе"
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-white" />,
      title: "В наличии",
      desc: "Склад в Сургуте"
    },
    {
      icon: <Truck className="w-8 h-8 text-white" />,
      title: "Доставка",
      desc: "По ХМАО и ЯНАО"
    },
    {
      icon: <Shield className="w-8 h-8 text-white" />,
      title: "Гарантия",
      desc: "От производителя"
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {advantages.map((adv, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 flex flex-col items-center text-center hover:bg-white/20 transition-colors">
                  <div className="mb-3 bg-blue-600/50 p-2 rounded-lg">
                    {adv.icon}
                  </div>
                  <p className="text-sm font-bold">{adv.title}</p>
                  <p className="text-xs text-blue-200">{adv.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Категории (быстрый доступ) */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">Популярные категории</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => navigate('/catalog?cat=general')}
              className="group cursor-pointer relative h-64 rounded-2xl overflow-hidden shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-blue-900 group-hover:scale-110 transition-transform duration-700"></div>
              {/* Тут должно быть изображение */}
              <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
                <h3 className="text-2xl font-bold mb-1">Дачные прицепы</h3>
                <p className="text-sm opacity-80">Самые популярные модели</p>
              </div>
            </div>

            <div 
              onClick={() => navigate('/catalog?cat=water')}
              className="group cursor-pointer relative h-64 rounded-2xl overflow-hidden shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-blue-800 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
                <h3 className="text-2xl font-bold mb-1">Лодочные</h3>
                <p className="text-sm opacity-80">Для катеров и гидроциклов</p>
              </div>
            </div>

            <div 
              onClick={() => navigate('/catalog?cat=moto')}
              className="group cursor-pointer relative h-64 rounded-2xl overflow-hidden shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-blue-700 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 p-6 z-20 text-white">
                <h3 className="text-2xl font-bold mb-1">Для мототехники</h3>
                <p className="text-sm opacity-80">Снегоходы и квадроциклы</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

