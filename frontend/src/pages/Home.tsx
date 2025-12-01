import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Award, MapPin, Phone, Clock, ExternalLink, Shield, Truck, Wrench, CheckCircle, ChevronLeft, ChevronRight, Anchor, Package, Ruler } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();
  const [visibleBenefits, setVisibleBenefits] = useState<Set<number>>(new Set());
  const benefitsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const heroSlides = [
    {
      image: '/images/hero/hero-freedom.png',
      title: 'Свобода не знает границ.',
      subtitle: 'Твой прицеп — тоже.',
      description: 'Бортовые прицепы от 1.8 до 4.6 м кузова • Лодочные от 3 до 9 м судна • Фургоны от 5 до 8 м³ объёма • Грузоподъёмность до 2.6 тонн',
      features: [
        { icon: <Ruler className="w-5 h-5" />, text: 'Кузов: 1853×1231 — 4587×1511 мм' },
        { icon: <Anchor className="w-5 h-5" />, text: 'Судно: 3000 — 9000 мм' },
        { icon: <Package className="w-5 h-5" />, text: 'Фургоны: 5 — 7.9 м³' }
      ],
      cta: { text: 'Подобрать размер', action: () => navigate('/configurator') }
    },
    {
      image: '/images/hero/hero-comfort.jpg',
      title: 'Не выбирай между уютом и приключениями.',
      subtitle: 'Бери всё сразу.',
      description: 'Тенты 15+ конфигураций и цветов • Дуги, стойки, каркасы • Лебёдки и ложементы для лодок • Крылья, борта, аппарели',
      features: [
        { icon: <Settings className="w-5 h-5" />, text: 'Тенты: плоские, высокие, каркасные' },
        { icon: <Anchor className="w-5 h-5" />, text: 'Лодочные: ролики, кильблоки, лебёдки' },
        { icon: <Wrench className="w-5 h-5" />, text: '136 аксессуаров в наличии' }
      ],
      cta: { text: 'Выбрать опции', action: () => navigate('/catalog') }
    },
    {
      image: '/images/hero/hero-takeall.png',
      title: 'Возьми всё.',
      subtitle: 'Один прицеп — тысяча возможностей.',
      description: 'Снегоход зимой, лодка летом, стройматериалы круглый год. Универсальные прицепы МЗСА адаптируются под любую задачу.',
      features: [
        { icon: <Truck className="w-5 h-5" />, text: 'Универсальные: мото, груз, техника' },
        { icon: <Shield className="w-5 h-5" />, text: 'Оцинковка: защита от коррозии' },
        { icon: <Award className="w-5 h-5" />, text: 'Гарантия 1 год от завода' }
      ],
      cta: { text: 'Смотреть каталог', action: () => navigate('/catalog') }
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  }, [heroSlides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-advance slides
  useEffect(() => {
    slideIntervalRef.current = setInterval(nextSlide, 7000);
    return () => {
      if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    };
  }, [nextSlide]);

  // Reset interval on manual navigation
  const handleManualNav = (action: () => void) => {
    if (slideIntervalRef.current) clearInterval(slideIntervalRef.current);
    action();
    slideIntervalRef.current = setInterval(nextSlide, 7000);
  };

  const benefits = [
    {
      title: "Заводское качество",
      description: "Прицепы МЗСА производятся на современном оборудовании с многоступенчатым контролем качества.",
      image: "/images/benefits/quality.jpg",
      icon: <CheckCircle className="w-6 h-6" />
    },
    {
      title: "Полная комплектация",
      description: "В наличии все аксессуары: тенты, дуги, лебёдки, ложементы, стойки, крылья и многое другое.",
      image: "/images/benefits/accessories.jpg",
      icon: <Wrench className="w-6 h-6" />
    },
    {
      title: "Доставка по региону",
      description: "Доставим прицеп в любой город ХМАО и ЯНАО. Собственный автопарк для транспортировки.",
      image: "/images/benefits/delivery.jpg",
      icon: <Truck className="w-6 h-6" />
    },
    {
      title: "Гарантия и сервис",
      description: "Официальная гарантия от производителя 1 год. Сервисное обслуживание в наших магазинах.",
      image: "/images/benefits/warranty.jpg",
      icon: <Shield className="w-6 h-6" />
    }
  ];

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    benefitsRef.current.forEach((ref, index) => {
      if (ref) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setVisibleBenefits(prev => new Set([...prev, index]));
              }
            });
          },
          { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
        );
        observer.observe(ref);
        observers.push(observer);
      }
    });
    return () => { observers.forEach(observer => observer.disconnect()); };
  }, []);

  const advantages = [
    { icon: <Award className="w-8 h-8 text-white" />, title: "Партнер завода", desc: "15 лет" },
    { icon: <MapPin className="w-8 h-8 text-white" />, title: "В наличии", desc: "В 4-х городах" },
    { icon: <Shield className="w-8 h-8 text-white" />, title: "Гарантия 1 год", desc: "От производителя" },
    { icon: <Settings className="w-8 h-8 text-white" />, title: "Аксессуары", desc: "Выбор опций" }
  ];

  const stores = [
    { city: "Сургут", address: "пр-т Мира, 55", phone: "+7 (3462) 22-33-55", hours: "9:00-20:00", mapUrl: "https://yandex.ru/maps/-/CHEiV6wh" },
    { city: "Нижневартовск", address: "ул. Индустриальная, 11а", phone: "+7 (3466) 62-54-20", hours: "9:00-19:00", mapUrl: "https://yandex.ru/maps/-/CHEiVCsN" },
    { city: "Ноябрьск", address: "ул. Ленина, 22", phone: "+7 (3496) 42-46-14", hours: "10:00-19:00", mapUrl: "https://yandex.ru/maps/-/CHEiVC8R" },
    { city: "Новый Уренгой", address: "ул. Таежная, 75", phone: "+7 (3494) 22-21-82", hours: "10:00-19:00", mapUrl: "https://yandex.ru/maps/-/CHEiVGzJ" }
  ];

  const categories = [
    { cat: 'general', title: 'Универсальные', desc: 'Для мототехники и грузов' },
    { cat: 'water', title: 'Лодочные', desc: 'Для лодок, катеров, гидроциклов' },
    { cat: 'commercial', title: 'Коммерческие', desc: 'Фургоны и эвакуаторы' }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Carousel */}
      <section className="relative h-[650px] sm:h-[700px] md:h-[700px] lg:h-[800px] overflow-hidden">
        {/* Slides */}
        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              idx === currentSlide 
                ? 'opacity-100 scale-100 z-10' 
                : 'opacity-0 scale-105 z-0'
            }`}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
            </div>

            {/* Content */}
            <div className="relative z-20 h-full flex items-center pb-40 sm:pb-24">
              <div className="container mx-auto px-4 md:px-8">
                <div className="max-w-2xl">
                  {/* Badge */}
                  <div className={`inline-flex items-center bg-orange-500/90 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 transition-all duration-700 delay-200 ${
                    idx === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <MapPin className="w-4 h-4 mr-2 text-white" />
                    <span className="text-sm font-medium text-white">Официальный дилер МЗСА</span>
                  </div>

                  {/* Title */}
                  <h1 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-2 leading-tight transition-all duration-700 delay-300 ${
                    idx === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    {slide.title}
                  </h1>
                  <p className={`text-3xl md:text-4xl lg:text-5xl font-bold text-orange-400 mb-6 transition-all duration-700 delay-400 ${
                    idx === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    {slide.subtitle}
                  </p>

                  {/* Description */}
                  <p className={`text-lg md:text-xl text-gray-200 mb-8 leading-relaxed transition-all duration-700 delay-500 ${
                    idx === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    {slide.description}
                  </p>

                  {/* Features - hidden on very small screens */}
                  <div className={`hidden sm:flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-8 transition-all duration-700 delay-600 ${
                    idx === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    {slide.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-2.5 sm:px-4 py-1.5 sm:py-2 text-white">
                        <span className="text-orange-400 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">{feature.icon}</span>
                        <span className="text-xs sm:text-sm font-medium">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-700 ${
                    idx === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <button
                      onClick={slide.cta.action}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 flex items-center justify-center transition-all transform hover:scale-105"
                    >
                      <Settings className="w-6 h-6 mr-2" />
                      {slide.cta.text}
                    </button>
                    <button
                      onClick={() => navigate('/catalog')}
                      className="hidden sm:flex bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-lg items-center justify-center transition-all"
                    >
                      Весь каталог
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={() => handleManualNav(prevSlide)}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
          aria-label="Предыдущий слайд"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => handleManualNav(nextSlide)}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all"
          aria-label="Следующий слайд"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-3">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleManualNav(() => goToSlide(idx))}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentSlide 
                  ? 'bg-orange-500 w-8' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Перейти к слайду ${idx + 1}`}
            />
          ))}
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pt-8 sm:pt-16 pb-16 sm:pb-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 max-w-4xl mx-auto">
              {advantages.map((adv, idx) => (
                <div key={idx} className="text-center text-white">
                  <div className="flex justify-center mb-2">{adv.icon}</div>
                  <p className="text-sm font-bold">{adv.title}</p>
                  <p className="text-xs text-gray-300">{adv.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-800 transition-colors">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Популярные категории</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {categories.map((c, i) => (
              <div key={i} onClick={() => navigate('/catalog?cat=' + c.cat)} className="group cursor-pointer relative h-64 sm:h-72 md:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                <img src={'/images/categories/' + c.cat + '.jpg'} alt={c.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 lg:p-8 z-20 text-white">
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>{c.title}</h3>
                  <p className="text-base md:text-lg" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
            <div><div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">65+</div><div className="text-sm text-blue-200">Моделей прицепов</div></div>
            <div><div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">136</div><div className="text-sm text-blue-200">Аксессуаров</div></div>
            <div><div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">15</div><div className="text-sm text-blue-200">Лет на рынке</div></div>
            <div><div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">4</div><div className="text-sm text-blue-200">Города присутствия</div></div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Почему выбирают нас</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Более 15 лет мы помогаем клиентам выбрать идеальный прицеп для их задач</p>
          </div>
          <div className="space-y-24 max-w-6xl mx-auto">
            {benefits.map((benefit, idx) => {
              const isEven = idx % 2 === 0;
              const isVisible = visibleBenefits.has(idx);
              return (
                <div key={idx} ref={el => { benefitsRef.current[idx] = el; }} className={'flex flex-col ' + (isEven ? 'lg:flex-row' : 'lg:flex-row-reverse') + ' items-center gap-8 lg:gap-16 transition-all duration-1000 ease-out ' + (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16')} style={{ transitionDelay: (idx * 100) + 'ms' }}>
                  <div className="w-full lg:w-1/2 relative group">
                    <div className={'absolute inset-0 bg-gradient-to-br ' + (isEven ? 'from-blue-500 to-orange-500' : 'from-orange-500 to-blue-500') + ' rounded-2xl transform rotate-3 opacity-20 group-hover:rotate-6 transition-transform duration-500'}></div>
                    <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                      <img src={benefit.image} alt={benefit.title} className="w-full h-64 md:h-80 object-cover transform group-hover:scale-105 transition-transform duration-700" onError={(e) => { (e.target as HTMLImageElement).src = '/images/categories/' + (isEven ? 'general' : 'water') + '.jpg'; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 text-center lg:text-left">
                    <div className={'inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 ' + (isEven ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400')}>{benefit.icon}</div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">{benefit.title}</h3>
                    <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-16">
            <button onClick={() => navigate('/catalog')} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105">
              Перейти в каталог<ExternalLink className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900 transition-colors">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <a href="https://o-n-r.ru" target="_blank" rel="noopener noreferrer" className="inline-block mb-4">
              <img src="/images/onr-logo.png" alt="Охота на рыбалку" className="h-16 mx-auto hover:opacity-80 transition-opacity dark:brightness-0 dark:invert" />
            </a>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Наши магазины</h2>
            <p className="text-gray-600 dark:text-gray-400">Сеть магазинов Охота на рыбалку — официальный дилер МЗСА в ХМАО и ЯНАО</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {stores.map((store, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">{store.city}</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{store.address}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-500 flex-shrink-0" /><a href={'tel:' + store.phone.replace(/[^\d+]/g, '')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">{store.phone}</a></div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{store.hours}</span></div>
                </div>
                <a href={store.mapUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"><ExternalLink className="w-4 h-4" />Показать на карте</a>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="https://o-n-r.ru/contacts/stores/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">Все магазины на сайте o-n-r.ru<ExternalLink className="w-4 h-4" /></a>
          </div>
        </div>
      </section>
    </div>
  );
};