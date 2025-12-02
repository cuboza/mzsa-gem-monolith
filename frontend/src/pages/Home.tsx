import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Award, MapPin, Phone, Clock, ExternalLink, Shield, Truck, Wrench, CheckCircle, ChevronLeft, ChevronRight, Users, Box, Puzzle } from 'lucide-react';
import { useHeroSlides } from '../hooks/useHeroSlides';
import { useStores } from '../hooks/useStores';
import { DynamicIcon } from '../utils/iconUtils';
import { LocalBusinessSchema } from '../components/common';

export const Home = () => {
  const navigate = useNavigate();
  const [visibleBenefits, setVisibleBenefits] = useState<Set<number>>(new Set());
  const benefitsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Загрузка слайдов и магазинов из настроек
  const { slides: heroSlides } = useHeroSlides();
  const { stores } = useStores();

  const techFeatures = [
    {
      title: "Горячее цинкование",
      description: "Полное покрытие рамы методом горячего цинкования защищает от коррозии как внешние поверхности, так и внутренние полости. В разы эффективнее напыления или краски.",
      image: "/images/tech/galvanizing.jpg",
      footer: "Срок службы: 25+ лет",
      footerColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Усиленная рама",
      description: "Сварная конструкция из профильной стали повышенной прочности. Рассчитана на интенсивную эксплуатацию в российских условиях — бездорожье, перепады температур, тяжёлые грузы.",
      image: "/images/tech/frame.jpg",
      footer: "Контроль качества сварки",
      footerColor: "text-orange-600 dark:text-orange-400"
    },
    {
      title: "Подвеска AL-KO",
      description: "Комплектующие немецкого бренда AL-KO: оси, ступицы, тормоза наката. Тормозной путь на 17% короче, ускорение торможения на 25% выше.",
      image: "/images/tech/suspension.jpg",
      footer: "Европейское качество",
      footerColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Борта на выбор",
      description: "Оцинкованные борта из профилированного листа — прочные и устойчивы к коррозии. Алюминиевые борта из анодированного профиля — лёгкие и долговечные.",
      image: "/images/tech/cert.jpg",
      footer: "Откидные и съёмные",
      footerColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Кастомизация",
      description: "Гибкая система опций: тент, дуги, лебёдка, запасное колесо, стояночный тормоз. Соберите прицеп под ваши задачи — от базовой до максимальной комплектации.",
      image: "/images/tech/options_custom.jpg",
      imageFit: "object-contain bg-white",
      footer: "50+ доступных опций",
      footerColor: "text-yellow-600 dark:text-yellow-400",
      subImages: [
        "/images/tech/options/winch.jpg",
        "/images/tech/options/tent.jpg",
        "/images/tech/options/wheel.jpg",
        "/images/tech/options/toolbox.jpg"
      ]
    },
    {
      title: "Сертификация",
      description: "Система менеджмента качества ГОСТ Р ИСО 9001. Сертификат EFQM «Признанное совершенство 5 звёзд». Электронный ПТС с регистрацией в ГИБДД.",
      image: "/images/tech/cert_scan.jpg",
      footer: "ISO 9001 + EFQM 5★",
      footerColor: "text-red-600 dark:text-red-400"
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
    { icon: <Users className="w-8 h-8 text-white" />, title: "Партнер завода", desc: "15 лет" },
    { icon: <Box className="w-8 h-8 text-white" />, title: "В наличии", desc: `В ${stores.length} городах` },
    { icon: <Shield className="w-8 h-8 text-white" />, title: "Гарантия 1 год", desc: "От производителя" },
    { icon: <Puzzle className="w-8 h-8 text-white" />, title: "Аксессуары", desc: "Выбор опций" }
  ];

  const categories = [
    { cat: 'general', title: 'Универсальные', desc: 'Для мототехники и грузов' },
    { cat: 'water', title: 'Лодочные', desc: 'Для лодок, катеров, гидроциклов' },
    { cat: 'commercial', title: 'Коммерческие', desc: 'Фургоны и эвакуаторы' }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* SEO: Микроразметка для локального бизнеса */}
      <LocalBusinessSchema />
      
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
              <div className="container mx-auto px-12 md:px-8">
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
                        <span className="text-orange-400 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-5 sm:[&>svg]:h-5">
                          <DynamicIcon name={feature.icon} className="w-5 h-5" />
                        </span>
                        <span className="text-xs sm:text-sm font-medium">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-700 ${
                    idx === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}>
                    <button
                      onClick={() => navigate('/catalog')}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 flex items-center justify-center transition-all transform hover:scale-105"
                    >
                      <Box className="w-6 h-6 mr-2" />
                      Открыть каталог
                    </button>
                    <button
                      onClick={() => navigate('/configurator')}
                      className="hidden sm:flex bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-lg items-center justify-center transition-all"
                    >
                      <Settings className="w-6 h-6 mr-2" />
                      Открыть конфигуратор
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
          className="absolute left-2 sm:left-4 md:left-8 top-1/3 sm:top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all"
          aria-label="Предыдущий слайд"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={() => handleManualNav(nextSlide)}
          className="absolute right-2 sm:right-4 md:right-8 top-1/3 sm:top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all"
          aria-label="Следующий слайд"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pt-6 pb-4 sm:pt-8 sm:pb-6">
          <div className="container mx-auto px-4">
            {/* Dots - теперь внутри Stats Bar */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleManualNav(() => goToSlide(idx))}
                  className={`h-2 sm:h-3 rounded-full transition-all ${
                    idx === currentSlide 
                      ? 'bg-orange-500 w-6 sm:w-8' 
                      : 'bg-white/50 hover:bg-white/70 w-2 sm:w-3'
                  }`}
                  aria-label={`Перейти к слайду ${idx + 1}`}
                />
              ))}
            </div>
            
            {/* Advantages grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 max-w-4xl mx-auto">
              {advantages.map((adv, idx) => (
                <div key={idx} className="text-center text-white">
                  <div className="flex justify-center mb-1 sm:mb-2">{adv.icon}</div>
                  <p className="text-xs sm:text-sm font-bold">{adv.title}</p>
                  <p className="text-[10px] sm:text-xs text-gray-300">{adv.desc}</p>
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



      {/* МЗСА Technology Section */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Award className="w-4 h-4" />
              Официальный дилер
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Преимущества прицепов МЗСА
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Московский завод специализированных автомобилей — лидер российского рынка прицепной техники. 
              Входит в десятку крупнейших производителей Европы.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {techFeatures.map((feature, idx) => (
              <div key={idx} className="group bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={feature.image} 
                    alt={feature.title} 
                    // @ts-ignore
                    className={`w-full h-full ${feature.imageFit || 'object-cover'} transform group-hover:scale-110 transition-transform duration-700`}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=' + feature.title; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                  <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white z-10">
                    {feature.title}
                  </h3>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-grow">
                    {feature.description}
                  </p>
                  {/* @ts-ignore */}
                  {feature.subImages && (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {/* @ts-ignore */}
                      {feature.subImages.map((img, i) => (
                        <img key={i} src={img} alt="" className="w-full h-12 object-cover rounded border border-gray-200 dark:border-gray-600" />
                      ))}
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className={`text-sm font-medium ${feature.footerColor}`}>{feature.footer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a 
              href="https://mzsa.ru/about/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Подробнее о заводе МЗСА
              <ExternalLink className="w-4 h-4" />
            </a>
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

      <section className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
            <div><div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">65+</div><div className="text-sm text-blue-200">Моделей прицепов</div></div>
            <div><div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">136</div><div className="text-sm text-blue-200">Аксессуаров</div></div>
            <div><div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">15</div><div className="text-sm text-blue-200">Лет на рынке</div></div>
            <div><div className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">{stores.length}</div><div className="text-sm text-blue-200">Города присутствия</div></div>
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
            {stores.map((store) => (
              <div key={store.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">{store.city}</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{store.address}</span></div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-green-500 flex-shrink-0" /><a href={'tel:' + store.phone.replace(/[^\d+]/g, '')} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">{store.phone}</a></div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500 flex-shrink-0" /><span className="text-gray-700 dark:text-gray-300">{store.hours}</span></div>
                </div>
                <a href={store.mapLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"><ExternalLink className="w-4 h-4" />Показать на карте</a>
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