import React from 'react';
import { 
  FileText, 
  ClipboardList, 
  Car, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Phone,
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight,
  Shield,
  Banknote,
  Calendar,
  FileCheck,
  Building2
} from 'lucide-react';
import { Card } from '../components/ui';

interface StepProps {
  number: number;
  title: string;
  description: string;
  details: React.ReactNode;
  icon: React.ReactNode;
}

function Step({ number, title, description, details, icon }: StepProps) {
  return (
    <div className="relative">
      {/* Линия соединения */}
      <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-orange-200 hidden md:block" />
      
      <Card padding="lg" className="relative">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Номер шага */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl relative z-10">
              {number}
            </div>
          </div>
          
          {/* Контент */}
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-orange-600">{icon}</div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <p className="text-gray-600 mb-4">{description}</p>
            <div className="bg-gray-50 rounded-lg p-4">
              {details}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function Registration() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-800 to-blue-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-blue-200 mb-4">
              <FileText className="w-5 h-5" />
              <span>Полезная информация</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Регистрация прицепа в ГИБДД
            </h1>
            <p className="text-lg md:text-xl text-blue-100">
              Пошаговая инструкция по постановке легкового прицепа на учёт. 
              Актуально для России на декабрь 2025 года.
            </p>
          </div>
        </div>
      </section>

      {/* Важная информация */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 text-lg mb-2">Важно!</h3>
                <p className="text-amber-700">
                  Постановка прицепа на учёт обязательна в течение <strong>10 дней</strong> с момента 
                  покупки. За нарушение сроков предусмотрен штраф от 1 500 до 2 000 рублей 
                  (ст. 19.22 КоАП РФ).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Основной контент */}
      <section className="py-8 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Шаг 1 */}
            <Step
              number={1}
              title="Подготовьте документы"
              description="Соберите полный пакет документов для регистрации прицепа"
              icon={<ClipboardList className="w-6 h-6" />}
              details={
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Обязательные документы:</h4>
                  <ul className="space-y-2">
                    {[
                      'Паспорт гражданина РФ (оригинал)',
                      'ПТС (паспорт транспортного средства) на прицеп',
                      'Договор купли-продажи или справка-счёт',
                      'Квитанция об оплате госпошлины',
                      'Заявление на регистрацию (заполняется на месте или через Госуслуги)',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <h4 className="font-semibold text-gray-900 pt-2">Дополнительно могут потребоваться:</h4>
                  <ul className="space-y-2">
                    {[
                      'Доверенность (если регистрирует не собственник)',
                      'Документы на номерные агрегаты (при замене рамы)',
                      'Страховой полис ОСАГО (для прицепов юр. лиц)',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              }
            />

            {/* Шаг 2 */}
            <Step
              number={2}
              title="Оплатите госпошлину"
              description="Размер госпошлины зависит от типа регистрационных действий"
              icon={<Banknote className="w-6 h-6" />}
              details={
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-orange-600 mb-1">2 350 ₽</div>
                      <div className="text-sm text-gray-600">
                        Полная регистрация с выдачей номеров
                      </div>
                      <ul className="mt-2 text-xs text-gray-500 space-y-1">
                        <li>• Госномер — 1 500 ₽</li>
                        <li>• СТС — 500 ₽</li>
                        <li>• Изменения в ПТС — 350 ₽</li>
                      </ul>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-blue-600 mb-1">850 ₽</div>
                      <div className="text-sm text-gray-600">
                        Без выдачи новых номеров
                      </div>
                      <ul className="mt-2 text-xs text-gray-500 space-y-1">
                        <li>• СТС — 500 ₽</li>
                        <li>• Изменения в ПТС — 350 ₽</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-green-800 text-sm">
                      <strong>💡 Совет:</strong> При оплате через Госуслуги действует скидка 30% 
                      (1 645 ₽ вместо 2 350 ₽)
                    </p>
                  </div>

                  <h4 className="font-semibold text-gray-900">Способы оплаты:</h4>
                  <ul className="space-y-2">
                    {[
                      'Через портал Госуслуги (со скидкой 30%)',
                      'В банке по реквизитам ГИБДД',
                      'Через терминал в отделении ГИБДД',
                      'Онлайн-банкинг или мобильное приложение банка',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              }
            />

            {/* Шаг 3 */}
            <Step
              number={3}
              title="Запишитесь на приём в ГИБДД"
              description="Выберите удобное отделение и время визита"
              icon={<Calendar className="w-6 h-6" />}
              details={
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Способы записи:</h4>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <a 
                      href="https://www.gosuslugi.ru/10059/2" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 p-4 rounded-lg border border-blue-200 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-grow">
                        <div className="font-semibold text-blue-900 group-hover:text-blue-700">Госуслуги</div>
                        <div className="text-sm text-blue-600">Рекомендуемый способ</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-blue-400" />
                    </a>
                    
                    <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700">Лично в ГИБДД</div>
                        <div className="text-sm text-gray-500">Живая очередь</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>💡 Совет:</strong> Через Госуслуги можно выбрать точное время визита и 
                      избежать очередей. Также там можно заполнить заявление онлайн.
                    </p>
                  </div>
                </div>
              }
            />

            {/* Шаг 4 */}
            <Step
              number={4}
              title="Пройдите осмотр прицепа"
              description="Инспектор проверит соответствие данных в документах и на прицепе"
              icon={<Car className="w-6 h-6" />}
              details={
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Что проверяет инспектор:</h4>
                  <ul className="space-y-2">
                    {[
                      'VIN-номер на раме прицепа',
                      'Соответствие VIN данным в ПТС',
                      'Наличие маркировки на раме',
                      'Общее техническое состояние',
                      'Габаритные размеры (если указаны в ПТС)',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <h4 className="font-semibold text-gray-900 pt-2">Рекомендации:</h4>
                  <ul className="space-y-2">
                    {[
                      'Прицеп должен быть чистым (VIN должен читаться)',
                      'Привезите прицеп на своём автомобиле или на эвакуаторе',
                      'Осмотр проводится на специальной площадке МРЭО',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              }
            />

            {/* Шаг 5 */}
            <Step
              number={5}
              title="Получите документы и номера"
              description="После успешной проверки вам выдадут регистрационные документы"
              icon={<FileCheck className="w-6 h-6" />}
              details={
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Вы получите:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">СТС</div>
                        <div className="text-sm text-gray-500">Свидетельство о регистрации ТС</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Государственный номер</div>
                        <div className="text-sm text-gray-500">Регистрационный знак для прицепа</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">ПТС с отметкой</div>
                        <div className="text-sm text-gray-500">Паспорт ТС с записью о регистрации</div>
                      </div>
                    </li>
                  </ul>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-green-800 text-sm">
                      <strong>✓ Готово!</strong> После получения номеров не забудьте установить 
                      их на прицеп. Номер должен быть освещён и читаем.
                    </p>
                  </div>
                </div>
              }
            />

            {/* Сроки */}
            <Card padding="lg" className="bg-blue-50 border-blue-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900 text-lg mb-2">Сроки оформления</h3>
                  <p className="text-blue-800">
                    Регистрация занимает <strong>1-2 часа</strong> при наличии всех документов. 
                    Если записались через Госуслуги — обслуживание в приоритетном порядке.
                  </p>
                </div>
              </div>
            </Card>

            {/* FAQ */}
            <div className="pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Частые вопросы</h2>
              
              <div className="space-y-4">
                <Card padding="md">
                  <h4 className="font-bold text-gray-900 mb-2">
                    Нужен ли техосмотр для прицепа?
                  </h4>
                  <p className="text-gray-600">
                    Для <strong>легковых прицепов физических лиц</strong> (категория О1 и О2, до 3,5 т) 
                    техосмотр <strong>не требуется</strong> с 2012 года. Для прицепов юридических лиц 
                    и тяжёлых прицепов (более 3,5 т) — ТО обязателен.
                  </p>
                </Card>

                <Card padding="md">
                  <h4 className="font-bold text-gray-900 mb-2">
                    Нужна ли страховка ОСАГО на прицеп?
                  </h4>
                  <p className="text-gray-600">
                    Для <strong>физических лиц</strong> — ОСАГО на прицеп <strong>не требуется</strong>. 
                    Ответственность покрывается полисом на тягач (автомобиль). 
                    Для <strong>юридических лиц</strong> — полис ОСАГО обязателен.
                  </p>
                </Card>

                <Card padding="md">
                  <h4 className="font-bold text-gray-900 mb-2">
                    Можно ли зарегистрировать прицеп в другом регионе?
                  </h4>
                  <p className="text-gray-600">
                    Да, с 2020 года можно зарегистрировать прицеп в любом МРЭО России, 
                    независимо от места прописки. Номера будут выданы с кодом региона 
                    по месту прописки владельца.
                  </p>
                </Card>

                <Card padding="md">
                  <h4 className="font-bold text-gray-900 mb-2">
                    Что делать, если VIN нечитаем?
                  </h4>
                  <p className="text-gray-600">
                    Если идентификационный номер повреждён или нечитаем, потребуется 
                    криминалистическая экспертиза. Это может занять дополнительное время (до 30 дней). 
                    Рекомендуем проверять читаемость VIN перед покупкой.
                  </p>
                </Card>
              </div>
            </div>

            {/* Помощь */}
            <Card padding="lg" className="bg-orange-50 border-orange-200">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-orange-900 text-lg mb-2">
                    Нужна помощь с документами?
                  </h3>
                  <p className="text-orange-800 mb-4">
                    Наши специалисты помогут подготовить документы и проконсультируют 
                    по всем вопросам регистрации прицепа.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a 
                      href="tel:+73462223355" 
                      className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      <Phone className="w-5 h-5" />
                      +7 (3462) 22-33-55
                    </a>
                    <a 
                      href="/contacts" 
                      className="inline-flex items-center gap-2 bg-white hover:bg-orange-50 text-orange-700 px-6 py-3 rounded-lg font-semibold border border-orange-300 transition-colors"
                    >
                      <MapPin className="w-5 h-5" />
                      Адреса магазинов
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* Дисклеймер */}
            <div className="text-center text-sm text-gray-500 pt-4">
              <p>
                Информация актуальна на декабрь 2025 года. Рекомендуем уточнять требования 
                в вашем региональном отделении ГИБДД.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
