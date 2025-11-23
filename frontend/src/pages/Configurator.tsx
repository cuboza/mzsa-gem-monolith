import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../services/api';
import { Trailer, Accessory, Vehicle, Order } from '../types';
import { vehicleDatabase } from '../data/vehicles';
import { CheckCircle, Truck, ChevronRight, AlertCircle, Settings, Package } from 'lucide-react';

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
  const [orderNumber, setOrderNumber] = useState('');

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
      
      // Если пришли из каталога с выбранным прицепом, сразу идем к аксессуарам
      if (location.state?.trailer) {
        setStep(3);
      }
    };
    loadData();
  }, [location.state]);

  // Логика совместимости
  const compatibleTrailers = useMemo(() => {
    if (!selectedVehicle) return trailers;

    return trailers.filter(t => {
      // 1. Проверка по категории совместимости
      if (t.compatibility && !t.compatibility.includes(selectedCategory as any)) {
        return false;
      }

      // 2. Проверка размеров и веса
      if (t.maxVehicleLength && selectedVehicle.length > t.maxVehicleLength) return false;
      if (t.maxVehicleWidth && selectedVehicle.width > t.maxVehicleWidth) return false;
      if (t.maxVehicleWeight && selectedVehicle.weight > t.maxVehicleWeight) return false;

      return true;
    });
  }, [trailers, selectedVehicle, selectedCategory]);

  // Итоговая сумма
  const totalPrice = (selectedTrailer?.price || 0) + 
    selectedAccessories.reduce((sum, acc) => sum + acc.price, 0);

  const formatPrice = (p: number) => new Intl.NumberFormat('ru-RU').format(p);

  // Обработчики
  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedTrailer(null); // Сброс прицепа при смене техники
  };

  const handleAccessoryToggle = (acc: Accessory) => {
    if (selectedAccessories.find(a => a.id === acc.id)) {
      setSelectedAccessories(prev => prev.filter(a => a.id !== acc.id));
    } else {
      setSelectedAccessories(prev => [...prev, acc]);
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
    <div className="min-h-screen bg-gray-50 pt-8 pb-20">
      <div className="container mx-auto px-4">
        {/* Прогресс бар */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2 max-w-3xl mx-auto">
            {['Техника', 'Прицеп', 'Аксессуары', 'Детали', 'Оформление'].map((label, idx) => (
              <div key={idx} className={`flex flex-col items-center w-1/5 ${idx + 1 === step ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 text-sm border-2 transition-colors
                  ${idx + 1 < step ? 'bg-green-500 border-green-500 text-white' : 
                    idx + 1 === step ? 'bg-white border-blue-600 text-blue-600' : 
                    'bg-white border-gray-300 text-gray-400'}`}>
                  {idx + 1 < step ? <CheckCircle size={16} /> : idx + 1}
                </div>
                <span className="text-xs hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-200 rounded-full max-w-3xl mx-auto overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${((step - 1) / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden min-h-[500px] flex flex-col">
          
          {/* Шаг 1: Выбор техники */}
          {step === 1 && (
            <div className="p-6 md:p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-6 text-center">Что будем перевозить?</h2>
              
              {/* Категории техники */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { id: 'snowmobile', name: 'Снегоход', icon: '❄️' },
                  { id: 'boat', name: 'Лодка / Катер', icon: '🚤' },
                  { id: 'atv', name: 'Квадроцикл', icon: '🚜' },
                  { id: 'motorcycle', name: 'Мотоцикл', icon: '🏍️' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCategory === cat.id 
                        ? 'border-blue-600 bg-blue-50 shadow-md' 
                        : 'border-gray-100 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{cat.icon}</div>
                    <div className="font-semibold">{cat.name}</div>
                  </button>
                ))}
              </div>

              {/* Список моделей */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Выберите вашу модель:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {vehicleDatabase[selectedCategory]?.map((vehicle, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleVehicleSelect(vehicle)}
                      className={`p-3 rounded-lg text-left border transition-all flex justify-between items-center ${
                        selectedVehicle === vehicle
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg transform scale-[1.02]'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{vehicle.brand}</div>
                        <div className="text-sm opacity-80">{vehicle.model}</div>
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
            <div className="p-6 md:p-8 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-2 text-center">Подходящие прицепы</h2>
              {selectedVehicle && (
                <p className="text-center text-gray-500 mb-6">
                  Для {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.length}x{selectedVehicle.width}мм)
                </p>
              )}

              {compatibleTrailers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-h-[60vh] overflow-y-auto p-2">
                  {compatibleTrailers.map(trailer => (
                    <div 
                      key={trailer.id}
                      onClick={() => setSelectedTrailer(trailer)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all relative ${
                        selectedTrailer?.id === trailer.id
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-100 hover:border-blue-300'
                      }`}
                    >
                      {selectedTrailer?.id === trailer.id && (
                        <div className="absolute -top-3 -right-3 bg-blue-600 text-white p-1 rounded-full z-10">
                          <CheckCircle size={20} />
                        </div>
                      )}
                      
                      <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden border border-gray-200">
                        <img 
                          src={trailer.image} 
                          alt={trailer.model}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                          }}
                        />
                      </div>

                      <h3 className="font-bold mb-1">{trailer.model}</h3>
                      <p className="text-sm text-gray-600 mb-2">{trailer.name}</p>
                      
                      {trailer.description ? (
                        <p className="text-xs text-gray-500 mb-3 italic border-l-2 border-blue-200 pl-2">
                          {trailer.description}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 mb-3 italic border-l-2 border-gray-200 pl-2">
                           {trailer.category === 'general' && 'Универсальный прицеп для различных грузов'}
                           {trailer.category === 'moto' && 'Для перевозки мототехники (снегоходы, квадроциклы, мотоциклы)'}
                           {trailer.category === 'water' && 'Для перевозки водной техники'}
                           {trailer.category === 'commercial' && 'Для коммерческих перевозок и тяжелых грузов'}
                           {trailer.category === 'wrecker' && 'Для эвакуации автомобилей и спецтехники'}
                        </p>
                      )}

                      <div className="text-xs space-y-1 text-gray-500 mb-4">
                        <p>Кузов: {trailer.dimensions}</p>
                        <p>Г/п: {trailer.capacity} кг</p>
                      </div>
                      <p className="text-xl font-bold text-blue-700 text-right">
                        {formatPrice(trailer.price)} ₽
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-red-50 rounded-xl mb-8">
                  <AlertCircle className="mx-auto text-red-500 w-12 h-12 mb-3" />
                  <p className="text-red-700 font-bold">Нет подходящих прицепов</p>
                  <p className="text-sm text-red-600">Попробуйте выбрать другую технику или свяжитесь с нами</p>
                </div>
              )}

              <div className="flex justify-between pt-6 border-t mt-auto">
                <button onClick={() => setStep(1)} className="text-gray-600 px-6 py-2 hover:bg-gray-100 rounded-lg">
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
              <h2 className="text-2xl font-bold mb-6 text-center">Добавить аксессуары</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-h-[60vh] overflow-y-auto">
                {accessories.map(acc => {
                   const isSelected = selectedAccessories.some(a => a.id === acc.id);
                   // Простая фильтрация аксессуаров (можно усложнить)
                   const isRelevant = acc.compatibleWith.includes('all') || 
                                      (selectedTrailer && (
                                        acc.compatibleWith.includes(selectedTrailer.id) ||
                                        acc.compatibleWith.includes(selectedTrailer.category) || 
                                        (selectedTrailer.compatibility && selectedTrailer.compatibility.some(c => acc.compatibleWith.includes(c)))
                                      ));

                   if (!isRelevant) return null;

                   return (
                    <div 
                      key={acc.id}
                      onClick={() => handleAccessoryToggle(acc)}
                      className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-200' 
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded border mr-4 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check size={14} />}
                      </div>
                      
                      {/* Фото аксессуара */}
                      <div className="w-20 h-20 mr-4 flex-shrink-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <img 
                          src={acc.image} 
                          alt={acc.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                          }}
                        />
                      </div>

                      <div className="flex-grow">
                        <h4 className="font-bold text-sm">{acc.name}</h4>
                        <p className="text-xs text-gray-500">{acc.description}</p>
                      </div>
                      <div className="font-bold text-blue-700 ml-4 whitespace-nowrap">
                        + {formatPrice(acc.price)} ₽
                      </div>
                    </div>
                   );
                })}
              </div>

              <div className="flex justify-between pt-6 border-t mt-auto">
                <button onClick={() => setStep(2)} className="text-gray-600 px-6 py-2 hover:bg-gray-100 rounded-lg">
                  Назад
                </button>
                <div className="text-right flex flex-col md:flex-row items-center gap-4">
                   <span className="text-sm text-gray-500">Итого: <b className="text-lg text-black">{formatPrice(totalPrice)} ₽</b></span>
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
               <h2 className="text-2xl font-bold mb-6 text-center">Проверьте конфигурацию</h2>

               <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="font-bold mb-4 text-lg border-b pb-2">Ваш выбор</h3>
                  
                  {/* Прицеп */}
                  <div className="flex justify-between mb-4">
                    <div>
                      <div className="font-bold text-lg">{selectedTrailer?.model}</div>
                      <div className="text-sm text-gray-600">{selectedTrailer?.name}</div>
                    </div>
                    <div className="font-bold">{formatPrice(selectedTrailer?.price || 0)} ₽</div>
                  </div>

                  {/* Техника */}
                  {selectedVehicle && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4 text-sm">
                      <span className="text-gray-500">Под технику:</span> {selectedVehicle.brand} {selectedVehicle.model}
                    </div>
                  )}

                  {/* Аксессуары */}
                  {selectedAccessories.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="text-sm font-semibold text-gray-500">Дополнительно:</div>
                      {selectedAccessories.map(acc => (
                        <div key={acc.id} className="flex justify-between items-center text-sm pl-2 border-l-2 border-orange-200">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                                <img 
                                  src={acc.image} 
                                  alt={acc.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                                  }}
                                />
                             </div>
                             <span>{acc.name}</span>
                          </div>
                          <span>{formatPrice(acc.price)} ₽</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4 flex justify-between items-center">
                    <span className="text-lg font-medium">Всего к оплате:</span>
                    <span className="text-3xl font-bold text-blue-700">{formatPrice(totalPrice)} ₽</span>
                  </div>
               </div>

               <div className="flex justify-between pt-6 border-t mt-auto">
                <button onClick={() => setStep(3)} className="text-gray-600 px-6 py-2 hover:bg-gray-100 rounded-lg">
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
              <h2 className="text-2xl font-bold mb-6 text-center">Оформление заказа</h2>
              
              <form onSubmit={handleSubmitOrder} className="max-w-lg mx-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Имя *</label>
                    <input
                      type="text"
                      required
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Иван Иванов"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Телефон *</label>
                    <input
                      type="tel"
                      required
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+7 (___) ___-__-__"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Регион *</label>
                  <select
                    required
                    value={customerForm.region}
                    onChange={(e) => setCustomerForm({...customerForm, region: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="ХМАО">ХМАО</option>
                    <option value="ЯНАО">ЯНАО</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Город *</label>
                  <input
                    type="text"
                    required
                    value={customerForm.city}
                    onChange={(e) => setCustomerForm({...customerForm, city: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Сургут"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium mb-2">Способ получения *</label>
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
                      <span>Самовывоз со склада</span>
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
                      <span>Доставка по адресу</span>
                    </label>
                  </div>
                  
                  {customerForm.deliveryMethod === 'delivery' && (
                    <div className="mt-3 animate-fadeIn">
                      <input
                        type="text"
                        required
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({...customerForm, address: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg bg-white"
                        placeholder="Улица, дом, квартира"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg mt-6"
                >
                  Подтвердить заказ
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(4)}
                  className="w-full text-gray-500 py-2 text-sm hover:underline"
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
              
              <h2 className="text-3xl font-bold mb-2 text-gray-800">Заказ оформлен!</h2>
              <p className="text-gray-500 mb-6">Спасибо за ваш выбор. Менеджер свяжется с вами в ближайшее время.</p>
              
              <div className="bg-gray-100 px-8 py-4 rounded-xl mb-8 border border-gray-200">
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Номер заказа</p>
                <p className="text-4xl font-mono font-bold text-blue-700">{orderNumber}</p>
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
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-semibold"
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

// Вспомогательный компонент иконки галочки
const Check = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

