import React from 'react';
import { ShieldCheck, FileText, AlertTriangle, Phone, CheckCircle, XCircle } from 'lucide-react';

export function Warranty() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-600 to-orange-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Гарантия на прицепы</h1>
            <p className="text-lg md:text-xl opacity-90">
              Официальная гарантия производителя МЗСА на все прицепы
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Warranty Badge */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-green-800 text-lg">Гарантия производителя</h3>
                <p className="text-green-700">
                  На все прицепы МЗСА предоставляется официальная гарантия от производителя 
                  сроком от 12 месяцев.
                </p>
              </div>
            </div>

            {/* General Info */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FileText className="w-7 h-7 text-orange-600" />
                Общая информация
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
                <p>
                  Во избежание недоразумений убедительно просим вас внимательно изучить руководство 
                  пользователя и условия гарантийных обязательств. Проверьте правильность заполнения 
                  гарантийного талона.
                </p>
                
                <p>
                  <strong>Гарантийный талон действителен только при наличии:</strong>
                </p>
              </div>

              <ul className="mt-4 space-y-3">
                {[
                  'Правильно и чётко указанной модели прицепа',
                  'Серийного номера изделия',
                  'Даты продажи',
                  'Чётких печатей фирмы-продавца',
                  'Подписи покупателя',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-6 text-gray-600">
                Модель и серийный номер изделия должны соответствовать указанным в гарантийном талоне.
              </p>
            </div>

            {/* Warranty Claims */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 text-orange-600" />
                Обращение по гарантии
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  Претензии принимаются непосредственно в магазине — любом из нашей сети. 
                  Обратитесь в администрацию магазина для урегулирования вашей проблемы.
                </p>
                
                <p>
                  При обращении по гарантии необходимо предоставить:
                </p>
              </div>

              <ul className="mt-4 space-y-3">
                {[
                  'Гарантийный талон',
                  'Документ, подтверждающий покупку (чек)',
                  'Прицеп для осмотра',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Warranty Limitations */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <XCircle className="w-7 h-7 text-red-600" />
                Ограничения гарантии
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600">
                <p>
                  Гарантийный талон признаётся недействительным в следующих случаях:
                </p>
              </div>

              <ul className="mt-4 space-y-3">
                {[
                  'Данные в гарантийном талоне изменены, стёрты или переписаны',
                  'Нарушены условия эксплуатации прицепа',
                  'Механические повреждения по вине покупателя',
                  'Ремонт производился неуполномоченными лицами',
                  'Установлены неоригинальные запчасти',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <p className="text-amber-800 text-sm">
                  <strong>Важно:</strong> В случае, если дату продажи установить невозможно, 
                  в соответствии с законодательством о защите прав потребителей, 
                  гарантийный срок исчисляется с даты изготовления изделия.
                </p>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Рекомендации по сохранению гарантии
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Сохраняйте документы', desc: 'Храните чек и гарантийный талон весь срок гарантии' },
                  { title: 'Соблюдайте нагрузку', desc: 'Не превышайте максимальную грузоподъёмность прицепа' },
                  { title: 'Регулярное ТО', desc: 'Проводите регулярное техническое обслуживание' },
                  { title: 'Используйте оригинал', desc: 'Устанавливайте только оригинальные запчасти и аксессуары' },
                ].map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-4">Вопросы по гарантии?</h2>
              <p className="mb-6 opacity-90">
                Свяжитесь с нами для консультации по гарантийным случаям
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
