import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../services/api';
import { Trailer, Accessory, Vehicle, Order } from '../types';
import { VehicleModel } from '../features/vehicles/vehicleTypes';
import { vehicleDatabase } from '../data/vehicles';
import { CheckCircle, Truck, ChevronRight, AlertCircle, Settings, Package, Search, Check, Plus, Minus, CircleOff, X, ShoppingCart, Phone } from 'lucide-react';
import { Stepper } from '../components/layout/Stepper';
import { TrailerCard } from '../components/TrailerCard';
import { CatalogFilters } from '../components/CatalogFilters';
import { formatPrice } from '../utils';
import { parseSearchQuery } from '../utils/searchParser';

const CONFIG_STEPS = [
  { label: 'Техника' },
  { label: 'Прицеп' },
  { label: 'Аксессуары' },
  { label: 'Детали' },
  { label: 'Оформление' },
];

export const Configurator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Начальные состояния
  const [step, setStep] = useState(1);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  
  // Выбор пользователя
  const [selectedCategory, setSelectedCategory] = useState<string>('snowmobile');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(location.state?.trailer || null);
  const [selectedAccessories, setSelectedAccessories] = useState<Accessory[]>([]);
  const [accessoryQuantities, setAccessoryQuantities] = useState<Record<string, number>>({});
  const [orderNumber, setOrderNumber] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [vehicleSearchResults, setVehicleSearchResults] = useState<VehicleModel[]>([]);
  const [showVehicleResults, setShowVehicleResults] = useState(false);

  // Фильтры
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [axles, setAxles] = useState<string>('all');
  const [brakes, setBrakes] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('price_asc');

  // Форма клиента
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    region: 'ХМАО',
    city: '',
    address: '',
    deliveryMethod: 'pickup',
    notes: ''
  });

  useEffect(() => {
    const loadData = async () => {
      const t = await db.getTrailers();
      const a = await db.getAccessories();
      setTrailers(t);
      setAccessories(a);
      
      // Если пришли из каталога с выбранным прицепом
      if (location.state?.trailer) {
        // Загружаем выбранные аксессуары по их ID
        if (location.state?.initialAccessories?.length > 0) {
          const selectedAccs = a.filter(acc => 
            location.state.initialAccessories.includes(acc.id)
          );
          setSelectedAccessories(selectedAccs);

          if (location.state.initialAccessoryQuantities) {
            setAccessoryQuantities(location.state.initialAccessoryQuantities);
          } else {
            const initialQty: Record<string, number> = {};
            selectedAccs.forEach(acc => initialQty[acc.id] = 1);
            setAccessoryQuantities(initialQty);
          }
        }
        
        // Переходим на указанный шаг (по умолчанию 4 - "Детали")
        const targetStep = location.state?.skipToStep || 4;
        setStep(targetStep);
      }
    };
    loadData();
  }, [location.state]);

  // Логика совместимости и фильтрации
  const compatibleTrailers = useMemo(() => {
    let result = trailers;

    // 0. Фильтрация по совместимости с техникой (если выбрана)
    if (selectedVehicle) {
      result = result.filter(t => {
        // 1. Проверка по категории совместимости
        if (t.compatibility && t.compatibility.length > 0 && !t.compatibility.includes(selectedCategory as any)) {
          return false;
        }

        // 2. Проверка размеров и веса (не для cargo - там размеры условные)
        if (selectedCategory !== 'cargo') {
          if (t.maxVehicleLength && selectedVehicle.length > 0 && selectedVehicle.length > t.maxVehicleLength) return false;
          if (t.maxVehicleWidth && selectedVehicle.width > 0 && selectedVehicle.width > t.maxVehicleWidth) return false;
          if (t.maxVehicleWeight && selectedVehicle.weight > 0 && selectedVehicle.weight > t.maxVehicleWeight) return false;
        }

        // 3. Проверка грузоподъёмности только для car (не для cargo - у фургонов иные параметры)
        if (selectedCategory === 'car' && selectedVehicle.weight > 0) {
          if (t.capacity && selectedVehicle.weight > t.capacity) return false;
        }

        return true;
      });
    } else if (selectedCategory) {
       // Если техника не выбрана, фильтруем по категории
       result = result.filter(t => !t.compatibility || t.compatibility.includes(selectedCategory as any));
    }

    // 3. Применение пользовательских фильтров
    result = result.filter(t => {
      const min = minPrice ? parseInt(minPrice) : 0;
      const max = maxPrice ? parseInt(maxPrice) : 10000000;
      if (t.price < min || t.price > max) return false;
      
      // Фильтр "только в наличии": ТОЛЬКО stock > 0
      if (onlyInStock && !(t.stock && t.stock > 0)) return false;
      if (axles !== 'all' && t.specs?.axles !== parseInt(axles)) return false;
      if (brakes !== 'all') {
        const hasBrakes = t.brakes && t.brakes.toLowerCase() !== 'нет';
        if (brakes === 'yes' && !hasBrakes) return false;
        if (brakes === 'no' && hasBrakes) return false;
      }
      return true;
    });

    // 4. Сортировка
    return result.sort((a, b) => {
      switch (sortOption) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'name_asc': return a.model.localeCompare(b.model);
        case 'name_desc': return b.model.localeCompare(a.model);
        default: return 0;
      }
    });
  }, [trailers, selectedVehicle, selectedCategory, minPrice, maxPrice, onlyInStock, axles, brakes, sortOption]);

  // Итоговая сумма
  const totalPrice = (selectedTrailer?.price || 0) + 
    selectedAccessories.reduce((sum, acc) => sum + (acc.price * (accessoryQuantities[acc.id] || 1)), 0);

  // Используем formatPrice из utils/

  // Обработчики
  const handleVehicleModelSelect = (model: VehicleModel) => {
    const vehicle: Vehicle = {
      brand: model.brand,
      model: model.model,
      length: model.length,
      width: model.width,
      height: model.height,
      weight: model.weight,
    };
    
    let category = 'other';
    if (['boat_pvc', 'boat_aluminum', 'boat_soviet', 'boat_rigid', 'boat'].includes(model.type)) category = 'boat';
    else if (model.type === 'snowmobile') category = 'snowmobile';
    else if (model.type === 'atv') category = 'atv';
    else if (model.type === 'motorcycle') category = 'motorcycle';
    else if (model.type === 'car') category = 'car';
    else if (model.type === 'cargo') category = 'cargo';
    
    setSelectedCategory(category);
    setSelectedVehicle(vehicle);
    setSelectedTrailer(null);
    setSearchInput(`${model.brand} ${model.model}`);
    setShowVehicleResults(false);
    setStep(2);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    // 1. Try database search
    const results = await db.searchVehicles(searchInput);
    if (results.length > 0) {
      setVehicleSearchResults(results);
      setShowVehicleResults(true);
      return;
    }

    const parsed = parseSearchQuery(searchInput);

    // Если найдена категория техники, устанавливаем её
    if (parsed.category) {
      setSelectedCategory(parsed.category);
    }

    // Создаём кастомный "vehicle" из поиска (если есть параметры)
    const hasParams = parsed.length || parsed.volume || parsed.weight;
    
    if (hasParams) {
      const customVehicle: Vehicle = {
        brand: 'Поиск',
        model: searchInput,
        length: parsed.length || 0,
        width: 0,
        height: 0,
        weight: parsed.weight || 0,
        volume: parsed.volume
      };
      setSelectedVehicle(customVehicle);
    } else {
      // Если только категория без размеров - сбрасываем vehicle
      setSelectedVehicle(null);
    }

    // Переходим на шаг 2 если найдена категория или параметры
    if (parsed.category || hasParams) {
      setStep(2);
    }
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedTrailer(null); // Сброс прицепа при смене техники
  };

  const updateAccessoryQuantity = (acc: Accessory, delta: number) => {
    setAccessoryQuantities(prev => {
      const currentQty = prev[acc.id] || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      if (newQty === 0) {
        const { [acc.id]: _, ...rest } = prev;
        setSelectedAccessories(prevAccs => prevAccs.filter(a => a.id !== acc.id));
        return rest;
      }
      
      if (currentQty === 0 && newQty > 0) {
         if (!selectedAccessories.find(a => a.id === acc.id)) {
            setSelectedAccessories(prevAccs => [...prevAccs, acc]);
         }
      }
      
      return { ...prev, [acc.id]: newQty };
    });
  };

  const handleAccessoryToggle = (acc: Accessory) => {
    const currentQty = accessoryQuantities[acc.id] || 0;
    if (currentQty > 0) {
      updateAccessoryQuantity(acc, -currentQty);
    } else {
      updateAccessoryQuantity(acc, 1);
    }
  };

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
    return `ONR-${year}${month}${day}-${random}`;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrailer) return;

    const newOrderNumber = generateOrderNumber();
    
    const order: Order = {
      id: `order-${Date.now()}`,
      orderNumber: newOrderNumber,
      date: new Date().toISOString(),
      status: 'new',
      customer: {
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
        region: customerForm.region as 'ХМАО' | 'ЯНАО',
        city: customerForm.city,
        address: customerForm.address
      },
      configuration: {
        trailer: selectedTrailer,
        accessories: selectedAccessories,
        vehicle: selectedVehicle || undefined,
        totalPrice
      },
      delivery: {
        method: customerForm.deliveryMethod as 'pickup' | 'delivery',
        region: customerForm.region as 'ХМАО' | 'ЯНАО',
        city: customerForm.city,
        address: customerForm.address
      },
      timeline: [{
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'new',
        title: 'Заказ создан',
        description: 'Заказ успешно оформлен через сайт'
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Сохранение заказа
    await db.createOrder(order);
    
    // Сохранение/обновление клиента
    const customers = await db.getCustomers();
    let customer = customers.find(c => c.phone === customerForm.phone);
    
    if (customer) {
      customer.orders.push(order.id);
      customer.totalSpent += totalPrice;
      customer.lastOrderAt = new Date().toISOString();
      await db.saveCustomer(customer); // Предполагаем, что такой метод есть или будет добавлен
    } else {
      customer = {
        id: `cust-${Date.now()}`,
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
        region: customerForm.region as 'ХМАО' | 'ЯНАО',
        city: customerForm.city,
        orders: [order.id],
        totalSpent: totalPrice,
        createdAt: new Date().toISOString(),
        lastOrderAt: new Date().toISOString()
      };
      await db.saveCustomer(customer);
    }

    setOrderNumber(newOrderNumber);
    setStep(6);
  };

  // ШАГИ КОНФИГУРАТОРА

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-4 pb-12">
      <div className="container mx-auto px-4">
        {/* Прогресс бар */}
        <div className="mb-4">
          <Stepper steps={CONFIG_STEPS} currentStep={step} />
        </div>

        <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden min-h-[500px] flex flex-col">
          
          {/* Шаг 1: Выбор техники */}
          {step === 1 && (
            <div className="p-6 md:p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Что будем перевозить?</h2>
              
              {/* Умный поиск */}
              <div className="max-w-2xl mx-auto mb-10">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Например: лодка 3.5 или снегоход 3200"
                    className="w-full pl-5 pr-14 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 text-lg shadow-sm transition-all"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Search size={24} />
                  </button>
                </form>
                
                {showVehicleResults && vehicleSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
                    {vehicleSearchResults.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleVehicleModelSelect(v)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                      >
                        <div className="font-bold text-gray-900 dark:text-white">{v.brand} {v.model}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex gap-3">
                          <span>{v.length}x{v.width} мм</span>
                          {v.weight > 0 && <span>{v.weight} кг</span>}
                          <span className="capitalize">{v.type.replace('_', ' ')}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Примеры: «лодка 4м», «снегоход 3.5м», «груз 10 куб м», «авто 3 тонны»
                </p>
              </div>

              <div className="relative flex py-5 items-center mb-8">
                  <div className="flex-grow border-t border-gray-200 dark:border-gray-600"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500">или выберите из списка</span>
                  <div className="flex-grow border-t border-gray-200 dark:border-gray-600"></div>
              </div>

              {/* Категории техники */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {[
                  { id: 'snowmobile', name: 'Снегоход', icon: '❄️' },
                  { id: 'boat', name: 'Лодка / Катер', icon: '🚤' },
                  { id: 'atv', name: 'Квадроцикл', icon: '🚜' },
                  { id: 'motorcycle', name: 'Мотоцикл', icon: '🏍️' },
                  { id: 'car', name: 'Автомобиль', icon: '🚗' },
                  { id: 'cargo', name: 'Грузы', icon: '📦' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCategory === cat.id 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-md' 
                        : 'border-gray-100 dark:border-gray-600 dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                    }`}
                  >
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{cat.name}</div>
                  </button>
                ))}
              </div>

              {/* Список моделей */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Выберите вашу модель:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {vehicleDatabase[selectedCategory]?.map((vehicle, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleVehicleSelect(vehicle)}
                      className={`p-3 rounded-lg text-left border transition-all flex justify-between items-center ${
                        selectedVehicle === vehicle
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg transform scale-[1.02]'
                          : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{vehicle.brand}</div>
                        <div className="text-sm opacity-80 text-gray-600 dark:text-gray-300">{vehicle.model}</div>
                      </div>
                      {selectedVehicle === vehicle && <CheckCircle size={20} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-auto pt-6 border-t">
                <button 
                  onClick={() => {
                    setSelectedVehicle(null);
                    setStep(2); // Пропустить шаг выбора техники
                  }}
                  className="text-gray-500 hover:text-gray-700 px-4 py-2"
                >
                  Пропустить (выбрать прицеп вручную)
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedVehicle}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center"
                >
                  Далее <ChevronRight size={20} className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Шаг 2: Выбор прицепа */}
          {step === 2 && (
            <div className="p-4 md:p-6 animate-fadeIn">
              <h2 className="text-xl font-bold mb-1 text-center text-gray-900 dark:text-white">Подходящие прицепы</h2>
              {selectedVehicle && (
                <p className="text-center text-gray-500 dark:text-gray-400 mb-3 text-sm">
                  Для {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.length}x{selectedVehicle.width}мм)
                </p>
              )}

              <CatalogFilters
                activeCategory={selectedCategory}
                onCategoryChange={() => {}}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                minPrice={minPrice}
                onMinPriceChange={setMinPrice}
                maxPrice={maxPrice}
                onMaxPriceChange={setMaxPrice}
                onlyInStock={onlyInStock}
                onStockChange={setOnlyInStock}
                axles={axles}
                onAxlesChange={setAxles}
                brakes={brakes}
                onBrakesChange={setBrakes}
                sortOption={sortOption}
                onSortChange={setSortOption}
                totalCount={compatibleTrailers.length}
                hideCategories={true}
              />

              {compatibleTrailers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-h-[60vh] overflow-y-auto p-2">
                  {compatibleTrailers.map(trailer => (
                    <TrailerCard
                      key={trailer.id}
                      trailer={trailer}
                      onClick={setSelectedTrailer}
                      selected={selectedTrailer?.id === trailer.id}
                      hideActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl mb-8">
                  <AlertCircle className="mx-auto text-red-500 w-12 h-12 mb-3" />
                  <p className="text-red-700 dark:text-red-400 font-bold">Нет подходящих прицепов</p>
                  <p className="text-sm text-red-600 dark:text-red-500">Попробуйте выбрать другую технику или свяжитесь с нами</p>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
                <button onClick={() => setStep(1)} className="text-gray-600 dark:text-gray-400 px-6 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  Назад
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedTrailer}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold disabled:opacity-50 hover:bg-blue-700 flex items-center"
                >
                  К аксессуарам <ChevronRight size={20} className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Шаг 3: Аксессуары */}
          {step === 3 && (
            <div className="p-6 md:p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Добавить аксессуары</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-h-[60vh] overflow-y-auto">
                {accessories.map(acc => {
                   const quantity = accessoryQuantities[acc.id] || 0;
                   const isSelected = quantity > 0;
                   const stockValue = parseInt(acc.stock || '10', 10);
                   const isInStock = stockValue > 0;

                   // Простая фильтрация аксессуаров (можно усложнить)
                   // Используем compatibility (массив) вместо compatibleWith
                   const accCompat = acc.compatibility || [];
                   const isRelevant = accCompat.length === 0 || accCompat.includes('all') || 
                                      (selectedTrailer && (
                                        accCompat.includes(selectedTrailer.id) ||
                                        accCompat.includes(selectedTrailer.category) || 
                                        (selectedTrailer.compatibility && selectedTrailer.compatibility.some(c => accCompat.includes(c)))
                                      ));

                   if (!isRelevant) return null;

                   return (
                    <div 
                      key={acc.id}
                      onClick={() => {
                        if (isInStock && !isSelected) handleAccessoryToggle(acc);
                      }}
                      className={`flex flex-col p-4 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200 dark:ring-orange-800' 
                          : isInStock
                            ? 'border-gray-100 dark:border-gray-600 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer'
                            : 'border-gray-100 dark:border-gray-600 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center w-full">
                        <div className={`w-6 h-6 rounded border mr-4 flex items-center justify-center flex-shrink-0 ${
                          isSelected 
                            ? 'bg-orange-600 border-orange-500 text-white' 
                            : isInStock
                              ? 'border-green-500 bg-white dark:bg-gray-700 text-green-500'
                              : 'border-red-300 bg-red-50 dark:bg-red-900/20 text-red-400'
                        }`}>
                          {isSelected ? <Check size={14} /> : (
                            isInStock ? <Check size={14} /> : <X size={14} />
                          )}
                        </div>
                        
                        {/* Фото аксессуара */}
                        <div className="w-20 h-20 mr-4 flex-shrink-0 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 overflow-hidden">
                          <img 
                            src={acc.image} 
                            alt={acc.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                            }}
                          />
                        </div>

                        <div className="flex-grow min-w-0">
                          <h4 className={`font-bold text-sm ${isInStock ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{acc.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{acc.description}</p>
                          
                          {!isInStock && (
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="text-xs font-bold text-red-500 flex items-center gap-1">
                                <CircleOff size={12} />
                                Нет в наличии
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`tel:+73462223355`, '_self');
                                }}
                                className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                              >
                                <ShoppingCart size={12} />
                                Заказать у менеджера
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-blue-700 dark:text-blue-400 ml-4 whitespace-nowrap">
                          + {formatPrice(acc.price)} ₽
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-orange-200 dark:border-orange-800/30 w-full" onClick={e => e.stopPropagation()}>
                          <span className="text-sm text-gray-600 dark:text-gray-300 mr-auto">Количество:</span>
                          <button 
                            onClick={() => updateAccessoryQuantity(acc, -1)}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold text-gray-900 dark:text-white w-6 text-center">{quantity}</span>
                          <button 
                            onClick={() => updateAccessoryQuantity(acc, 1)}
                            disabled={quantity >= stockValue}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              quantity >= stockValue 
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-300 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                   );
                })}
              </div>

              <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
                <button onClick={() => setStep(2)} className="text-gray-600 dark:text-gray-400 px-6 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  Назад
                </button>
                <div className="text-right flex flex-col md:flex-row items-center gap-4">
                   <span className="text-sm text-gray-500 dark:text-gray-400">Итого: <b className="text-lg text-black dark:text-white">{formatPrice(totalPrice)} ₽</b></span>
                   <button
                    onClick={() => setStep(4)}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 flex items-center"
                  >
                    Продолжить <ChevronRight size={20} className="ml-2" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Шаг 4: Детали заказа (переход к оформлению) */}
           {step === 4 && (
            <div className="p-6 md:p-8 animate-fadeIn">
               <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Проверьте конфигурацию</h2>

               <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-8">
                  <h3 className="font-bold mb-4 text-lg border-b border-gray-200 dark:border-gray-600 pb-2 text-gray-900 dark:text-white">Ваш выбор</h3>
                  
                  {/* Прицеп */}
                  <div className="flex justify-between mb-4">
                    <div>
                      <div className="font-bold text-lg text-gray-900 dark:text-white">{selectedTrailer?.model}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{selectedTrailer?.name}</div>
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white">{formatPrice(selectedTrailer?.price || 0)} ₽</div>
                  </div>

                  {/* Техника */}
                  {selectedVehicle && (
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500 mb-4 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Под технику:</span> <span className="text-gray-900 dark:text-white">{selectedVehicle.brand} {selectedVehicle.model}</span>
                    </div>
                  )}

                  {/* Аксессуары */}
                  {selectedAccessories.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Дополнительно:</div>
                      {selectedAccessories.map(acc => {
                        const qty = accessoryQuantities[acc.id] || 1;
                        return (
                        <div key={acc.id} className="flex justify-between items-center text-sm pl-2 border-l-2 border-orange-200 dark:border-orange-700">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-500">
                                <img 
                                  src={acc.image} 
                                  alt={acc.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                                  }}
                                />
                             </div>
                             <span className="text-gray-900 dark:text-white">
                               {acc.name} {qty > 1 && <span className="text-gray-500 dark:text-gray-400">x {qty}</span>}
                             </span>
                          </div>
                          <span className="text-gray-900 dark:text-white">{formatPrice(acc.price * qty)} ₽</span>
                        </div>
                      )})}
                    </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-4 flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900 dark:text-white">Всего к оплате:</span>
                    <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">{formatPrice(totalPrice)} ₽</span>
                  </div>
               </div>

               <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
                <button onClick={() => setStep(3)} className="text-gray-600 dark:text-gray-400 px-6 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  Изменить
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 flex items-center shadow-lg shadow-green-500/20"
                >
                  Перейти к оформлению <ChevronRight size={20} className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Шаг 5: Форма оформления */}
          {step === 5 && (
            <div className="p-6 md:p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Оформление заказа</h2>
              
              <form onSubmit={handleSubmitOrder} className="max-w-lg mx-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Имя *</label>
                    <input
                      type="text"
                      required
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Иван Иванов"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Телефон *</label>
                    <input
                      type="tel"
                      required
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+7 (___) ___-__-__"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    Email <span className="text-gray-400 font-normal">(для уведомлений)</span>
                  </label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="example@mail.ru"
                  />
                </div>

                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Регион *</label>
                  <select
                    required
                    value={customerForm.region}
                    onChange={(e) => setCustomerForm({...customerForm, region: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                  >
                    <option value="ХМАО">ХМАО</option>
                    <option value="ЯНАО">ЯНАО</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Город *</label>
                  <input
                    type="text"
                    required
                    value={customerForm.city}
                    onChange={(e) => setCustomerForm({...customerForm, city: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    placeholder="Сургут"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Способ получения *</label>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        value="pickup"
                        checked={customerForm.deliveryMethod === 'pickup'}
                        onChange={(e) => setCustomerForm({...customerForm, deliveryMethod: 'pickup'})}
                        className="mr-2 w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-900 dark:text-white">Самовывоз со склада</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        value="delivery"
                        checked={customerForm.deliveryMethod === 'delivery'}
                        onChange={(e) => setCustomerForm({...customerForm, deliveryMethod: 'delivery'})}
                        className="mr-2 w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-900 dark:text-white">Доставка по адресу</span>
                    </label>
                  </div>
                  
                  {customerForm.deliveryMethod === 'delivery' && (
                    <div className="mt-3 animate-fadeIn">
                      <input
                        type="text"
                        required
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
                        placeholder="Улица, дом, квартира"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg mt-6"
                >
                  Подтвердить заказ
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full text-gray-500 dark:text-gray-400 py-2 text-sm hover:underline"
                >
                  Вернуться назад
                </button>
              </form>
            </div>
          )}

          {/* Шаг 6: Успех */}
          {step === 6 && (
            <div className="p-8 md:p-12 text-center animate-fadeIn flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce-small">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">Заказ оформлен!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Спасибо за ваш выбор. Менеджер свяжется с вами в ближайшее время.</p>
              
              <div className="bg-gray-100 dark:bg-gray-700 px-8 py-4 rounded-xl mb-8 border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Номер заказа</p>
                <p className="text-4xl font-mono font-bold text-blue-700 dark:text-blue-400">{orderNumber}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button
                  onClick={() => navigate(`/track?order=${orderNumber}`)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold shadow-md"
                >
                  Отследить заказ
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-semibold"
                >
                  На главную
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



