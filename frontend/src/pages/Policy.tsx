import React from 'react';
import { Shield, Lock, Eye, FileText, Mail, Phone } from 'lucide-react';

export function Policy() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-600 to-orange-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Политика конфиденциальности</h1>
            <p className="text-lg md:text-xl opacity-90">
              Защита персональных данных пользователей
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Introduction */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Shield className="w-7 h-7 text-orange-600" />
                Общие положения
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
                <p>
                  Настоящая Политика конфиденциальности персональных данных (далее — Политика) 
                  действует в отношении всей информации, которую сайт прицепов МЗСА, расположенный 
                  на доменном имени, может получить о Пользователе во время использования сайта.
                </p>
                
                <p>
                  Использование сайта означает безоговорочное согласие Пользователя с настоящей 
                  Политикой и указанными в ней условиями обработки его персональных данных.
                </p>
              </div>
            </div>

            {/* Data Collection */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Eye className="w-7 h-7 text-orange-600" />
                Сбор персональных данных
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
                <p>Мы собираем следующие данные:</p>
              </div>

              <ul className="mt-4 space-y-3">
                {[
                  'Имя и фамилия',
                  'Номер телефона',
                  'Адрес электронной почты',
                  'Адрес доставки (при оформлении заказа)',
                  'Данные о заказах',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm">
                  Персональные данные предоставляются Пользователем добровольно при заполнении 
                  форм на сайте, оформлении заказа или обращении в службу поддержки.
                </p>
              </div>
            </div>

            {/* Data Usage */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FileText className="w-7 h-7 text-orange-600" />
                Использование данных
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
                <p>Персональные данные Пользователя используются для:</p>
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                {[
                  { title: 'Обработка заказов', desc: 'Оформление, доставка и отслеживание заказов' },
                  { title: 'Связь с клиентом', desc: 'Уведомления о статусе заказа, ответы на вопросы' },
                  { title: 'Улучшение сервиса', desc: 'Анализ для повышения качества обслуживания' },
                  { title: 'Маркетинг', desc: 'Информирование об акциях и новинках (с согласия)' },
                ].map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Protection */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Lock className="w-7 h-7 text-orange-600" />
                Защита данных
              </h2>
              
              <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
                <p>
                  Мы принимаем необходимые организационные и технические меры для защиты 
                  персональных данных Пользователя от неправомерного или случайного доступа, 
                  уничтожения, изменения, блокирования, копирования, распространения, 
                  а также от иных неправомерных действий третьих лиц.
                </p>
                
                <p>
                  Мы не передаём персональные данные третьим лицам, за исключением случаев, 
                  предусмотренных законодательством Российской Федерации.
                </p>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-green-800 text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  Все данные передаются по защищённому соединению (SSL/TLS)
                </p>
              </div>
            </div>

            {/* User Rights */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Права пользователя</h2>
              
              <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
                <p>Пользователь имеет право:</p>
              </div>

              <ul className="mt-4 space-y-3">
                {[
                  'Получить информацию об обработке своих персональных данных',
                  'Требовать уточнения, блокирования или уничтожения персональных данных',
                  'Отозвать согласие на обработку персональных данных',
                  'Обжаловать действия или бездействие оператора в уполномоченный орган',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cookies */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Использование cookies</h2>
              
              <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
                <p>
                  Сайт использует файлы cookies для улучшения работы сайта и повышения удобства 
                  его использования. Cookies — это небольшие текстовые файлы, которые сохраняются 
                  на вашем устройстве.
                </p>
                
                <p>
                  Вы можете отключить использование cookies в настройках вашего браузера, 
                  однако это может повлиять на функциональность сайта.
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Связаться с нами</h2>
              <p className="mb-6 opacity-90">
                По вопросам обработки персональных данных вы можете обратиться:
              </p>
              
              <div className="flex flex-col md:flex-row gap-4">
                <a 
                  href="mailto:info@o-n-r.ru"
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  info@o-n-r.ru
                </a>
                <a 
                  href="tel:+73462223355"
                  className="inline-flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  +7 (3462) 22-33-55
                </a>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center text-gray-500 text-sm">
              Последнее обновление: ноябрь 2025
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
