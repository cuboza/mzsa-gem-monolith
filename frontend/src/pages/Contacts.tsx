import React from 'react';
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import { Card } from '../components/ui';
import { useStores } from '../hooks/useStores';

export function Contacts() {
  const { stores, mainStore } = useStores();
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-600 to-orange-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Контакты</h1>
            <p className="text-lg md:text-xl opacity-90">
              Сеть магазинов «Охота на рыбалку» — официальный дилер прицепов МЗСА
            </p>
          </div>
        </div>
      </section>

      {/* Main Contact */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card padding="lg" className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Единый номер</h2>
                  <a 
                    href={`tel:${mainStore?.phone.replace(/[^+\d]/g, '') || '+73462223355'}`}
                    className="text-3xl font-bold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    {mainStore?.phone || '+7 (3462) 22-33-55'}
                  </a>
                </div>
                <div className="flex flex-col gap-2">
                  <a 
                    href="mailto:info@o-n-r.ru"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    info@o-n-r.ru
                  </a>
                  <a 
                    href="https://o-n-r.ru" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    o-n-r.ru
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stores Grid */}
      <section className="pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Наши магазины</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {stores.map((store) => (
                <Card 
                  key={store.city} 
                  padding="md"
                  hover
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{store.city}</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-gray-800">{store.address}</p>
                        <a 
                          href={store.mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
                        >
                          Показать на карте
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <a 
                          href={`tel:${store.phone.replace(/[^+\d]/g, '')}`}
                          className="text-gray-800 hover:text-orange-600 block"
                        >
                          {store.phone}
                        </a>
                        {store.phone2 && (
                          <a 
                            href={`tel:${store.phone2.replace(/[^+\d]/g, '')}`}
                            className="text-gray-600 hover:text-orange-600 block text-sm"
                          >
                            {store.phone2}
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-600">{store.hours}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card padding="none" className="overflow-hidden">
              <iframe
                src="https://yandex.ru/map-widget/v1/?um=constructor%3Aa0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0a0&amp;source=constructor&amp;ll=73.426112,61.257078&amp;z=5"
                width="100%"
                height="400"
                frameBorder="0"
                title="Карта магазинов"
                className="w-full"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form Promo */}
      <section className="pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-4">Нужна консультация?</h2>
              <p className="mb-6 opacity-90">
                Наши специалисты помогут подобрать прицеп под ваши задачи
              </p>
              <a 
                href="tel:+73462223355"
                className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Позвонить
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
