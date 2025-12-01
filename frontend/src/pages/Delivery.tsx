import React from 'react';
import { Truck, MapPin, Clock, Phone, CreditCard, Package, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui';

export function Delivery() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-600 to-orange-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Условия доставки</h1>
            <p className="text-lg md:text-xl opacity-90">
              Доставляем прицепы МЗСА по городам ХМАО и ЯНАО, а также в регионы России
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Free Delivery Banner */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-green-800 text-lg">Бесплатная доставка по городу</h3>
                <p className="text-green-700">
                  При заказе от 10 000 ₽. При заказе менее 10 000 ₽ — стоимость доставки 250 ₽.
                </p>
              </div>
            </div>

            {/* City Delivery */}
            <Card padding="lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <MapPin className="w-7 h-7 text-orange-600" />
                Доставка по городам присутствия
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  Мы осуществляем доставку во всех городах, где расположены наши магазины: 
                  <strong> Сургут, Нижневартовск, Ноябрьск, Новый Уренгой</strong>, 
                  а также в ближайшие населённые пункты.
                </p>
                
                <p>
                  Доставка крупногабаритного товара (прицепы) обсуждается индивидуально с менеджером.
                </p>
              </div>

              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Телефоны для заказа:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center justify-between">
                      <span className="text-gray-600">Сургут:</span>
                      <a href="tel:+73462550449" className="text-orange-600 font-medium">+7 (3462) 55-04-49</a>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-gray-600">Нижневартовск:</span>
                      <a href="tel:+73466227070" className="text-orange-600 font-medium">+7 (3466) 22-70-70</a>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-gray-600">Новый Уренгой:</span>
                      <a href="tel:+73494222152" className="text-orange-600 font-medium">+7 (3494) 22-21-52</a>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-gray-600">Ноябрьск:</span>
                      <a href="tel:+73496424614" className="text-orange-600 font-medium">+7 (3496) 42-46-14</a>
                    </li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Сроки доставки:</h4>
                  <p className="text-gray-600 text-sm">
                    Время доставки согласовывается дополнительно с менеджером при оформлении заказа.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Обычно 1-3 рабочих дня</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Regional Delivery */}
            <Card padding="lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Package className="w-7 h-7 text-orange-600" />
                Доставка в регионы России
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  В регионы России отправляем транспортными компаниями: 
                  <strong> Почта России, СДЭК</strong> или любой удобной ТК на выбор покупателя.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800">Условия оплаты</h4>
                    <p className="text-amber-700 text-sm">
                      Доставка в регионы осуществляется только после 100% безналичной предоплаты.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Стоимость доставки</h4>
                    <p className="text-blue-700 text-sm">
                      Рассчитывается индивидуально в зависимости от габаритов и региона. 
                      Для уточнения свяжитесь с менеджером.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Pickup */}
            <Card padding="lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <CheckCircle className="w-7 h-7 text-orange-600" />
                Самовывоз
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  Вы можете забрать прицеп самостоятельно из любого нашего магазина. 
                  При самовывозе наши специалисты проведут инструктаж по эксплуатации 
                  и помогут с первичной настройкой.
                </p>
              </div>

              <div className="mt-6 grid md:grid-cols-2 gap-4">
                {[
                  { city: 'Сургут', address: 'пр-т Мира, 55', hours: '9:00-20:00' },
                  { city: 'Нижневартовск', address: 'ул. Индустриальная, 11а', hours: '9:00-19:00' },
                  { city: 'Ноябрьск', address: 'ул. Ленина, 22', hours: '10:00-19:00' },
                  { city: 'Новый Уренгой', address: 'ул. Таёжная, 75', hours: '10:00-19:00' },
                ].map((store) => (
                  <div key={store.city} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{store.city}</p>
                      <p className="text-sm text-gray-600">{store.address}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {store.hours}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* CTA */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-4">Остались вопросы по доставке?</h2>
              <p className="mb-6 opacity-90">
                Позвоните нам, и мы подберём оптимальный вариант доставки
              </p>
              <a 
                href="tel:+73462223355"
                className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                <Phone className="w-5 h-5" />
                +7 (3462) 22-33-55
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
