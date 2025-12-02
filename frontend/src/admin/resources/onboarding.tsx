/**
 * Страница онбординга для React Admin
 * Полное руководство по работе с системой
 */

import { Title, usePermissions, useGetIdentity } from 'react-admin';
import { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  Database, 
  ArrowRight,
  Lightbulb,
  Shield,
  ClipboardList,
  Eye,
  Upload,
  MapPin,
  Warehouse,
  Image,
  BookOpen,
  User,
  Phone,
  Truck,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  Globe,
  Home,
  ExternalLink,
  Lock,
  UserPlus,
  Store,
  Wrench,
  Boxes,
  LayoutDashboard,
  Circle
} from 'lucide-react';

// =====================================================
// ТИПЫ ДАННЫХ
// =====================================================

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  content: React.ReactNode;
  tips?: string[];
  warnings?: string[];
  relatedPath?: string;
}

interface TutorialSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  steps: TutorialStep[];
  availableFor: ('admin' | 'manager')[];
}

interface OnboardingProgress {
  completedSteps: string[];
  currentSection: string;
  lastUpdated: string;
}

// =====================================================
// КЛЮЧ ПРОГРЕССА
// =====================================================

const getProgressKey = (userId: string | undefined) => 
  `onboarding_progress_v2_${userId || 'anonymous'}`;

// =====================================================
// КОНТЕНТ ТУТОРИАЛОВ
// =====================================================

// Happy Path: Посетитель сайта
const visitorHappyPath: TutorialSection = {
  id: 'visitor',
  title: 'Путь посетителя',
  description: 'Как клиент находит и выбирает прицеп на сайте',
  icon: Globe,
  color: 'text-cyan-600',
  bgColor: 'bg-cyan-50',
  borderColor: 'border-cyan-200',
  availableFor: ['admin', 'manager'],
  steps: [
    {
      id: 'visitor-1',
      title: 'Главная страница',
      description: 'Первое знакомство с сайтом',
      icon: Home,
      content: (
        <div className="space-y-4">
          <p>Посетитель попадает на главную страницу сайта, где видит:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Hero-секцию</strong> — слайдер с акциями и популярными прицепами</li>
            <li><strong>Категории прицепов</strong> — быстрый переход к нужному типу</li>
            <li><strong>Популярные модели</strong> — хиты продаж</li>
            <li><strong>Преимущества</strong> — почему стоит выбрать нас</li>
            <li><strong>Контакты и карта</strong> — филиалы сети</li>
          </ul>
        </div>
      ),
      tips: ['Hero-слайды настраиваются в админке', 'Популярные прицепы определяются автоматически по продажам'],
      relatedPath: '/'
    },
    {
      id: 'visitor-2',
      title: 'Каталог',
      description: 'Просмотр и фильтрация прицепов',
      icon: Search,
      content: (
        <div className="space-y-4">
          <p>В каталоге посетитель может:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Фильтровать по категории</strong> — бортовые, лодочные, коммерческие</li>
            <li><strong>Искать по параметрам</strong> — вес, длина, цена</li>
            <li><strong>Умный поиск</strong> — "прицеп для лодки 5 метров"</li>
            <li><strong>Сортировать</strong> — по цене, популярности, новизне</li>
          </ul>
          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Умный поиск понимает:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Тип техники: "для снегохода", "под квадроцикл"</li>
              <li>• Размеры: "4 метра", "350 см"</li>
              <li>• Вес: "до 2 тонн", "1500 кг"</li>
            </ul>
          </div>
        </div>
      ),
      tips: ['Фильтры сохраняются в URL для удобного шаринга'],
      relatedPath: '/catalog'
    },
    {
      id: 'visitor-3',
      title: 'Конфигуратор',
      description: 'Помощь в выборе прицепа',
      icon: Wrench,
      content: (
        <div className="space-y-4">
          <p>Конфигуратор помогает выбрать прицеп через несколько шагов:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Выбор техники</strong> — что нужно перевозить</li>
            <li><strong>Параметры техники</strong> — размеры и вес</li>
            <li><strong>Подбор прицепа</strong> — подходящие варианты</li>
            <li><strong>Выбор опций</strong> — допы и аксессуары</li>
          </ol>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">🛥️</span>
              <p className="text-xs mt-1">Лодки</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">🛷</span>
              <p className="text-xs mt-1">Снегоходы</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl">🏍️</span>
              <p className="text-xs mt-1">Квадроциклы</p>
            </div>
          </div>
        </div>
      ),
      tips: ['Конфигуратор учитывает совместимость прицепа с техникой'],
      relatedPath: '/configurator'
    },
    {
      id: 'visitor-4',
      title: 'Карточка товара',
      description: 'Детальная информация о прицепе',
      icon: Package,
      content: (
        <div className="space-y-4">
          <p>На странице товара посетитель видит:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Галерею фото</strong> — с возможностью увеличения</li>
            <li><strong>Характеристики</strong> — полный список параметров</li>
            <li><strong>Цена и наличие</strong> — на разных складах</li>
            <li><strong>Опции</strong> — доступные дополнения</li>
            <li><strong>Похожие товары</strong> — альтернативы</li>
          </ul>
        </div>
      ),
      tips: ['Наличие обновляется при синхронизации с 1С']
    },
    {
      id: 'visitor-5',
      title: 'Контакты',
      description: 'Как связаться с магазином',
      icon: Phone,
      content: (
        <div className="space-y-4">
          <p>Страница контактов содержит:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Телефоны</strong> — главный и по филиалам</li>
            <li><strong>Email</strong> — для письменных обращений</li>
            <li><strong>Карту филиалов</strong> — интерактивная карта</li>
            <li><strong>Режим работы</strong> — часы работы каждого магазина</li>
          </ul>
          <div className="bg-green-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-green-800 mb-2">📞 Контакты сети:</h4>
            <p className="text-green-700">+7 (3462) 22-33-55</p>
            <p className="text-green-700">info@o-n-r.ru</p>
          </div>
        </div>
      ),
      relatedPath: '/contacts'
    }
  ]
};

// Happy Path: Покупатель
const buyerHappyPath: TutorialSection = {
  id: 'buyer',
  title: 'Путь покупателя',
  description: 'Как оформить заказ и отслеживать его',
  icon: ShoppingCart,
  color: 'text-green-600',
  bgColor: 'bg-green-50',
  borderColor: 'border-green-200',
  availableFor: ['admin', 'manager'],
  steps: [
    {
      id: 'buyer-1',
      title: 'Регистрация',
      description: 'Создание аккаунта',
      icon: UserPlus,
      content: (
        <div className="space-y-4">
          <p>Для оформления заказа покупатель может зарегистрироваться:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Email и пароль</strong> — классическая регистрация</li>
            <li><strong>Телефон</strong> — для связи по заказу</li>
            <li><strong>ФИО</strong> — для документов</li>
          </ul>
          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 После регистрации доступно:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• История заказов</li>
              <li>• Сохранённые данные для быстрого оформления</li>
              <li>• Отслеживание статусов</li>
            </ul>
          </div>
        </div>
      ),
      tips: ['Регистрация не обязательна — можно заказать как гость'],
      relatedPath: '/register'
    },
    {
      id: 'buyer-2',
      title: 'Добавление в корзину',
      description: 'Выбор товаров',
      icon: ShoppingCart,
      content: (
        <div className="space-y-4">
          <p>Покупатель добавляет товары в корзину:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Прицеп</strong> — основной товар</li>
            <li><strong>Опции</strong> — дополнительное оборудование</li>
            <li><strong>Аксессуары</strong> — сопутствующие товары</li>
          </ul>
          <p className="mt-4">При добавлении:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Проверяется наличие на складе</li>
            <li>Резервируется товар (на время оформления)</li>
            <li>Рассчитывается итоговая сумма</li>
          </ul>
        </div>
      ),
      tips: ['Резерв товара снимается при отмене заказа']
    },
    {
      id: 'buyer-3',
      title: 'Оформление заказа',
      description: 'Ввод данных и подтверждение',
      icon: ClipboardList,
      content: (
        <div className="space-y-4">
          <p>Процесс оформления заказа:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Контактные данные</strong> — ФИО, телефон, email</li>
            <li><strong>Способ получения</strong> — самовывоз или доставка</li>
            <li><strong>Выбор филиала</strong> — где забрать или куда доставить</li>
            <li><strong>Комментарий</strong> — пожелания к заказу</li>
            <li><strong>Подтверждение</strong> — проверка и отправка</li>
          </ol>
        </div>
      ),
      tips: ['Заказ автоматически получает номер вида WEB-YYYYMMDD-0001'],
      warnings: ['Обязательно проверьте телефон — по нему свяжется менеджер']
    },
    {
      id: 'buyer-4',
      title: 'Отслеживание заказа',
      description: 'Проверка статуса',
      icon: Truck,
      content: (
        <div className="space-y-4">
          <p>Покупатель может отслеживать заказ:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>В личном кабинете</strong> — полная история</li>
            <li><strong>По номеру заказа</strong> — без авторизации</li>
            <li><strong>SMS/Email</strong> — уведомления о смене статуса</li>
          </ul>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span>Новый — ожидает обработки</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              <span>В обработке — менеджер связался</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400"></span>
              <span>Подтверждён — ждём оплаты</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <span>Завершён — товар выдан</span>
            </div>
          </div>
        </div>
      ),
      relatedPath: '/track-order'
    },
    {
      id: 'buyer-5',
      title: 'Получение товара',
      description: 'Финальный этап',
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <p>При получении товара:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Осмотр</strong> — проверка комплектации и состояния</li>
            <li><strong>Документы</strong> — ПТС, гарантийный талон, чек</li>
            <li><strong>Инструктаж</strong> — как использовать прицеп</li>
            <li><strong>Подпись</strong> — акт приёма-передачи</li>
          </ul>
          <div className="bg-amber-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-amber-800 mb-2">⚠️ Важно при получении:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Проверить соответствие заказу</li>
              <li>• Осмотреть на наличие повреждений</li>
              <li>• Получить все документы</li>
            </ul>
          </div>
        </div>
      ),
      tips: ['Гарантия активируется с момента покупки']
    }
  ]
};

// Happy Path: Менеджер
const managerHappyPath: TutorialSection = {
  id: 'manager',
  title: 'Работа менеджера',
  description: 'Обработка заказов и работа с клиентами',
  icon: ClipboardList,
  color: 'text-blue-600',
  bgColor: 'bg-blue-50',
  borderColor: 'border-blue-200',
  availableFor: ['admin', 'manager'],
  steps: [
    {
      id: 'manager-1',
      title: 'Просмотр заказов',
      description: 'Список новых заявок',
      icon: ShoppingCart,
      content: (
        <div className="space-y-4">
          <p>В разделе "Заказы" менеджер видит:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Новые заявки</strong> — требуют обработки</li>
            <li><strong>В работе</strong> — взяты в обработку</li>
            <li><strong>Подтверждённые</strong> — ждут оплаты/выдачи</li>
            <li><strong>Завершённые</strong> — архив</li>
          </ul>
          <div className="bg-yellow-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-yellow-800 mb-2">⏰ Приоритеты:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Новые заказы — связаться в течение 15 минут</li>
              <li>• Срочные (предоплата) — в первую очередь</li>
            </ul>
          </div>
        </div>
      ),
      tips: ['Заказы сортируются по дате — новые сверху'],
      relatedPath: '/admin/orders'
    },
    {
      id: 'manager-2',
      title: 'Обработка заказа',
      description: 'Связь с клиентом и подтверждение',
      icon: Phone,
      content: (
        <div className="space-y-4">
          <p>При обработке заказа менеджер:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Открывает карточку заказа</strong></li>
            <li><strong>Изучает состав</strong> — прицеп, опции, комментарий</li>
            <li><strong>Проверяет наличие</strong> — на нужном складе</li>
            <li><strong>Звонит клиенту</strong> — уточняет детали</li>
            <li><strong>Меняет статус</strong> — "В обработке"</li>
          </ol>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Скрипт звонка:</h4>
            <p className="text-sm text-gray-600">
              "Добрый день! Это магазин 'Охота на рыбалку'. 
              Вы оставили заявку на прицеп [модель]. 
              Подтверждаете заказ?"
            </p>
          </div>
        </div>
      ),
      tips: ['Всегда фиксируйте результат звонка в комментарии'],
      warnings: ['Не забудьте проверить наличие перед звонком!']
    },
    {
      id: 'manager-3',
      title: 'Управление статусами',
      description: 'Жизненный цикл заказа',
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <p>Доступные статусы заказа:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <Clock className="text-yellow-600 mt-0.5" size={20} />
              <div>
                <div className="font-medium text-yellow-800">Новый</div>
                <p className="text-sm text-yellow-700">Только поступил, ждёт обработки</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <RefreshCw className="text-blue-600 mt-0.5" size={20} />
              <div>
                <div className="font-medium text-blue-800">В обработке</div>
                <p className="text-sm text-blue-700">Менеджер работает с заказом</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <CheckCircle className="text-purple-600 mt-0.5" size={20} />
              <div>
                <div className="font-medium text-purple-800">Подтверждён</div>
                <p className="text-sm text-purple-700">Клиент подтвердил, ждём оплаты</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600 mt-0.5" size={20} />
              <div>
                <div className="font-medium text-green-800">Завершён</div>
                <p className="text-sm text-green-700">Товар выдан, заказ закрыт</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <XCircle className="text-red-600 mt-0.5" size={20} />
              <div>
                <div className="font-medium text-red-800">Отменён</div>
                <p className="text-sm text-red-700">Клиент отказался или не вышел на связь</p>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: ['При смене статуса обязательно добавляйте комментарий'],
      warnings: ['При отмене заказа резерв товара снимается автоматически']
    },
    {
      id: 'manager-4',
      title: 'Работа с клиентами',
      description: 'База клиентов и история',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>В разделе "Клиенты" доступно:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Список клиентов</strong> — с поиском и фильтрами</li>
            <li><strong>Карточка клиента</strong> — контакты и история</li>
            <li><strong>История заказов</strong> — все покупки клиента</li>
            <li><strong>Комментарии</strong> — заметки о клиенте</li>
          </ul>
          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-blue-800 mb-2">💡 Полезно:</h4>
            <p className="text-sm text-blue-700">
              Если клиент уже покупал — поприветствуйте по имени 
              и упомяните прошлый заказ.
            </p>
          </div>
        </div>
      ),
      relatedPath: '/admin/customers'
    },
    {
      id: 'manager-5',
      title: 'Проверка наличия',
      description: 'Склады и остатки',
      icon: Boxes,
      content: (
        <div className="space-y-4">
          <p>Менеджер может проверить:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Остатки по складам</strong> — в карточке товара</li>
            <li><strong>Резервы</strong> — забронированные товары</li>
            <li><strong>В пути</strong> — ожидаемые поступления</li>
          </ul>
          <div className="bg-amber-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-amber-800 mb-2">⚠️ Важно:</h4>
            <p className="text-sm text-amber-700">
              При звонке клиенту всегда уточняйте актуальное наличие — 
              остатки могут измениться.
            </p>
          </div>
        </div>
      ),
      relatedPath: '/admin/trailers'
    }
  ]
};

// Happy Path: Администратор
const adminHappyPath: TutorialSection = {
  id: 'admin',
  title: 'Работа администратора',
  description: 'Полное управление системой',
  icon: Shield,
  color: 'text-purple-600',
  bgColor: 'bg-purple-50',
  borderColor: 'border-purple-200',
  availableFor: ['admin'],
  steps: [
    {
      id: 'admin-1',
      title: 'Управление пользователями',
      description: 'Создание и права доступа',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>Администратор управляет пользователями системы:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Создание</strong> — новые менеджеры и администраторы</li>
            <li><strong>Роли</strong> — admin или manager</li>
            <li><strong>Блокировка</strong> — отключение доступа</li>
            <li><strong>Сброс пароля</strong> — если забыл</li>
          </ul>
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Права по ролям:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-800">Менеджер</div>
                <ul className="text-blue-700 mt-1">
                  <li>• Заказы — просмотр и обработка</li>
                  <li>• Клиенты — просмотр</li>
                  <li>• Товары — только просмотр</li>
                </ul>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-800">Администратор</div>
                <ul className="text-purple-700 mt-1">
                  <li>• Всё, что менеджер</li>
                  <li>• Товары — редактирование</li>
                  <li>• Настройки — полный доступ</li>
                  <li>• Пользователи — управление</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
      relatedPath: '/admin/users'
    },
    {
      id: 'admin-2',
      title: 'Управление товарами',
      description: 'Прицепы и аксессуары',
      icon: Package,
      content: (
        <div className="space-y-4">
          <p>Раздел "Прицепы" позволяет:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Добавлять</strong> — новые модели</li>
            <li><strong>Редактировать</strong> — цены, описания, фото</li>
            <li><strong>Скрывать</strong> — временно убирать с сайта</li>
            <li><strong>Управлять остатками</strong> — по складам</li>
          </ul>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Важные поля:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>visible_on_site</strong> — показывать на сайте</li>
              <li><strong>retail_price</strong> — цена для клиентов</li>
              <li><strong>category</strong> — general/water/commercial</li>
              <li><strong>compatibility</strong> — для какой техники</li>
            </ul>
          </div>
        </div>
      ),
      tips: ['Изменения цен сразу отображаются на сайте'],
      relatedPath: '/admin/trailers'
    },
    {
      id: 'admin-3',
      title: 'Настройка сайта',
      description: 'Hero-слайды, магазины, контент',
      icon: LayoutDashboard,
      content: (
        <div className="space-y-4">
          <p>Контентные разделы админки:</p>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Image size={20} className="text-gray-600" />
                <span className="font-medium">Hero-слайды</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Баннеры на главной странице — акции, новинки
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-gray-600" />
                <span className="font-medium">Магазины</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Филиалы сети — адреса, телефоны, координаты
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Warehouse size={20} className="text-gray-600" />
                <span className="font-medium">Склады</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Места хранения товара — для учёта остатков
              </p>
            </div>
          </div>
        </div>
      ),
      relatedPath: '/admin/hero-slides'
    },
    {
      id: 'admin-4',
      title: 'Импорт данных',
      description: 'Загрузка из 1С',
      icon: Upload,
      content: (
        <div className="space-y-4">
          <p>Импорт товаров и остатков из 1С:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li><strong>Выгрузка из 1С</strong> — в формате JSON</li>
            <li><strong>Загрузка в админку</strong> — через раздел "Импорт"</li>
            <li><strong>Валидация</strong> — проверка данных</li>
            <li><strong>Применение</strong> — обновление базы</li>
          </ol>
          <div className="bg-amber-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-amber-800 mb-2">⚠️ Внимание:</h4>
            <p className="text-sm text-amber-700">
              Импорт перезаписывает данные! Перед крупным импортом 
              сделайте бэкап.
            </p>
          </div>
        </div>
      ),
      relatedPath: '/admin/import-1c'
    },
    {
      id: 'admin-5',
      title: 'Бэкап и восстановление',
      description: 'Резервное копирование',
      icon: Database,
      content: (
        <div className="space-y-4">
          <p>Раздел "Бэкап" позволяет:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Создать бэкап</strong> — всех данных системы</li>
            <li><strong>Скачать</strong> — архив для хранения</li>
            <li><strong>Восстановить</strong> — из ранее созданного</li>
          </ul>
          <div className="bg-red-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium text-red-800 mb-2">🔴 Важно:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Делайте бэкап перед крупными изменениями</li>
              <li>• Храните бэкапы в нескольких местах</li>
              <li>• Проверяйте восстановление периодически</li>
            </ul>
          </div>
        </div>
      ),
      relatedPath: '/admin/backup'
    },
    {
      id: 'admin-6',
      title: 'Настройки системы',
      description: 'Глобальные параметры',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p>В настройках можно изменить:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Контактные данные</strong> — телефоны, email</li>
            <li><strong>Режим работы</strong> — часы работы магазинов</li>
            <li><strong>SEO-параметры</strong> — мета-теги, заголовки</li>
            <li><strong>Интеграции</strong> — 1С, платёжные системы</li>
          </ul>
        </div>
      ),
      relatedPath: '/admin/settings'
    }
  ]
};

// Все секции
const allSections: TutorialSection[] = [
  visitorHappyPath,
  buyerHappyPath,
  managerHappyPath,
  adminHappyPath
];

// =====================================================
// КОМПОНЕНТЫ
// =====================================================

// Боковая панель секций
const SectionSidebar = ({ 
  sections, 
  activeSection, 
  onSelect, 
  userRole,
  progress,
  onStepClick 
}: { 
  sections: TutorialSection[];
  activeSection: string;
  onSelect: (id: string) => void;
  userRole: 'admin' | 'manager';
  progress: OnboardingProgress;
  onStepClick: (stepId: string) => void;
}) => {
  const [expandedSection, setExpandedSection] = useState<string>(activeSection);
  
  return (
    <div className="w-72 border-r bg-gray-50 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
          Разделы руководства
        </h3>
        <div className="space-y-1">
          {sections.map(section => {
            const Icon = section.icon;
            const isAvailable = section.availableFor.includes(userRole);
            const isActive = activeSection === section.id;
            const isExpanded = expandedSection === section.id;
            const completedStepsCount = section.steps.filter(
              step => progress.completedSteps.includes(step.id)
            ).length;
            const totalSteps = section.steps.length;
            const isCompleted = completedStepsCount === totalSteps;
            
            return (
              <div key={section.id}>
                <button
                  onClick={() => {
                    if (isAvailable) {
                      onSelect(section.id);
                      setExpandedSection(isExpanded ? '' : section.id);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all
                    ${isActive 
                      ? `${section.bgColor} ${section.borderColor} border-2` 
                      : isAvailable 
                        ? 'hover:bg-gray-100' 
                        : 'opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className={`p-2 rounded-lg ${isActive ? section.bgColor : 'bg-white'}`}>
                    <Icon size={20} className={section.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {section.title}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      {completedStepsCount}/{totalSteps} шагов
                      {isCompleted && <CheckCircle size={12} className="text-green-500" />}
                    </div>
                  </div>
                  {isAvailable && (
                    <ChevronRight 
                      size={16} 
                      className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  )}
                  {!isAvailable && <Lock size={16} className="text-gray-400" />}
                </button>
                
                {/* Подшаги */}
                {isExpanded && isAvailable && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-3">
                    {section.steps.map(step => {
                      const StepIcon = step.icon;
                      const isStepCompleted = progress.completedSteps.includes(step.id);
                      return (
                        <button
                          key={step.id}
                          onClick={() => onStepClick(step.id)}
                          className={`
                            w-full flex items-center gap-2 p-2 rounded text-left text-sm
                            hover:bg-gray-100 transition-colors
                            ${isStepCompleted ? 'text-gray-500' : 'text-gray-700'}
                          `}
                        >
                          {isStepCompleted ? (
                            <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle size={14} className="text-gray-300 flex-shrink-0" />
                          )}
                          <span className="truncate">{step.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Контент шага
const StepContent = ({ 
  step, 
  isCompleted,
  onMarkComplete,
  onNavigate 
}: { 
  step: TutorialStep;
  isCompleted: boolean;
  onMarkComplete: () => void;
  onNavigate?: (path: string) => void;
}) => {
  const Icon = step.icon;
  
  return (
    <div className="p-6">
      {/* Заголовок */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-gray-100 rounded-xl">
          <Icon size={24} className="text-gray-700" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{step.title}</h2>
          <p className="text-gray-500 mt-1">{step.description}</p>
        </div>
        <button
          onClick={onMarkComplete}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
            ${isCompleted 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          <CheckCircle size={16} />
          {isCompleted ? 'Пройдено' : 'Отметить'}
        </button>
      </div>
      
      {/* Контент */}
      <div className="prose prose-sm max-w-none text-gray-700">
        {step.content}
      </div>
      
      {/* Советы */}
      {step.tips && step.tips.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
            <Lightbulb size={18} />
            <span>Советы</span>
          </div>
          <ul className="space-y-1">
            {step.tips.map((tip, i) => (
              <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                <span className="text-blue-400">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Предупреждения */}
      {step.warnings && step.warnings.length > 0 && (
        <div className="mt-4 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
            <AlertTriangle size={18} />
            <span>Обратите внимание</span>
          </div>
          <ul className="space-y-1">
            {step.warnings.map((warning, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="text-amber-400">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Ссылка на раздел */}
      {step.relatedPath && onNavigate && (
        <div className="mt-6">
          <button
            onClick={() => onNavigate(step.relatedPath!)}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ExternalLink size={16} />
            Перейти в раздел
          </button>
        </div>
      )}
    </div>
  );
};

// Контент секции
const SectionContent = ({ 
  section,
  currentStepId,
  progress,
  onMarkComplete,
  onStepChange,
  onNavigate
}: { 
  section: TutorialSection;
  currentStepId: string;
  progress: OnboardingProgress;
  onMarkComplete: (stepId: string) => void;
  onStepChange: (stepId: string) => void;
  onNavigate?: (path: string) => void;
}) => {
  const currentStep = section.steps.find(s => s.id === currentStepId) || section.steps[0];
  const currentIndex = section.steps.findIndex(s => s.id === currentStepId);
  const isCompleted = progress.completedSteps.includes(currentStep.id);
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Заголовок секции */}
      <div className={`px-6 py-4 ${section.bgColor} border-b ${section.borderColor}`}>
        <div className="flex items-center gap-3">
          <section.icon size={24} className={section.color} />
          <div>
            <h2 className="font-bold text-gray-900">{section.title}</h2>
            <p className="text-sm text-gray-600">{section.description}</p>
          </div>
        </div>
      </div>
      
      {/* Навигация по шагам */}
      <div className="px-6 py-3 border-b bg-white flex items-center gap-2 overflow-x-auto">
        {section.steps.map((step, index) => {
          const isStepCompleted = progress.completedSteps.includes(step.id);
          const isCurrent = step.id === currentStepId;
          return (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap
                transition-colors
                ${isCurrent 
                  ? 'bg-gray-900 text-white' 
                  : isStepCompleted
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 text-xs">
                {isStepCompleted ? <CheckCircle size={12} /> : index + 1}
              </span>
              {step.title}
            </button>
          );
        })}
      </div>
      
      {/* Контент шага */}
      <div className="flex-1 overflow-y-auto">
        <StepContent 
          step={currentStep}
          isCompleted={isCompleted}
          onMarkComplete={() => onMarkComplete(currentStep.id)}
          onNavigate={onNavigate}
        />
      </div>
      
      {/* Навигация */}
      <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
        <button
          onClick={() => {
            if (currentIndex > 0) {
              onStepChange(section.steps[currentIndex - 1].id);
            }
          }}
          disabled={currentIndex === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Назад
        </button>
        <span className="text-sm text-gray-500">
          Шаг {currentIndex + 1} из {section.steps.length}
        </span>
        <button
          onClick={() => {
            if (currentIndex < section.steps.length - 1) {
              onStepChange(section.steps[currentIndex + 1].id);
            }
          }}
          disabled={currentIndex === section.steps.length - 1}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Далее →
        </button>
      </div>
    </div>
  );
};

// =====================================================
// ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ
// =====================================================

export const OnboardingList = () => {
  const { permissions } = usePermissions();
  const { data: identity } = useGetIdentity();
  const userId = identity?.id as string | undefined;
  
  const [activeSection, setActiveSection] = useState<string>('visitor');
  const [currentStepId, setCurrentStepId] = useState<string>('visitor-1');
  const [progress, setProgress] = useState<OnboardingProgress>({
    completedSteps: [],
    currentSection: 'visitor',
    lastUpdated: new Date().toISOString()
  });

  const userRole = (permissions as 'admin' | 'manager') || 'manager';
  const availableSections = allSections.filter(s => s.availableFor.includes(userRole));

  // Загрузка прогресса
  useEffect(() => {
    if (userId) {
      const key = getProgressKey(userId);
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as OnboardingProgress;
          setProgress(parsed);
          setActiveSection(parsed.currentSection);
          // Найти первый незавершённый шаг в текущей секции
          const section = allSections.find(s => s.id === parsed.currentSection);
          if (section) {
            const firstIncomplete = section.steps.find(
              step => !parsed.completedSteps.includes(step.id)
            );
            setCurrentStepId(firstIncomplete?.id || section.steps[0].id);
          }
        } catch (e) {
          console.error('Failed to parse onboarding progress', e);
        }
      }
    }
  }, [userId]);

  // Сохранение прогресса
  const saveProgress = useCallback((newProgress: OnboardingProgress) => {
    if (userId) {
      const key = getProgressKey(userId);
      localStorage.setItem(key, JSON.stringify(newProgress));
    }
  }, [userId]);

  // Смена секции
  const handleSectionChange = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    const section = allSections.find(s => s.id === sectionId);
    if (section) {
      // Найти первый незавершённый шаг
      const firstIncomplete = section.steps.find(
        step => !progress.completedSteps.includes(step.id)
      );
      setCurrentStepId(firstIncomplete?.id || section.steps[0].id);
    }
    const newProgress = {
      ...progress,
      currentSection: sectionId,
      lastUpdated: new Date().toISOString()
    };
    setProgress(newProgress);
    saveProgress(newProgress);
  }, [progress, saveProgress]);

  // Отметить шаг как пройденный
  const handleMarkComplete = useCallback((stepId: string) => {
    const newCompletedSteps = progress.completedSteps.includes(stepId)
      ? progress.completedSteps.filter(id => id !== stepId)
      : [...progress.completedSteps, stepId];
    
    const newProgress = {
      ...progress,
      completedSteps: newCompletedSteps,
      lastUpdated: new Date().toISOString()
    };
    setProgress(newProgress);
    saveProgress(newProgress);
  }, [progress, saveProgress]);

  // Переход к шагу
  const handleStepClick = useCallback((stepId: string) => {
    setCurrentStepId(stepId);
    // Найти секцию этого шага
    for (const section of allSections) {
      if (section.steps.some(s => s.id === stepId)) {
        if (section.id !== activeSection) {
          handleSectionChange(section.id);
        }
        break;
      }
    }
  }, [activeSection, handleSectionChange]);

  // Навигация во внешний раздел
  const handleNavigate = useCallback((path: string) => {
    window.location.href = path;
  }, []);

  // Сброс прогресса
  const handleResetProgress = useCallback(() => {
    if (confirm('Сбросить весь прогресс обучения?')) {
      const newProgress: OnboardingProgress = {
        completedSteps: [],
        currentSection: 'visitor',
        lastUpdated: new Date().toISOString()
      };
      setProgress(newProgress);
      setActiveSection('visitor');
      setCurrentStepId('visitor-1');
      saveProgress(newProgress);
    }
  }, [saveProgress]);

  const currentSection = availableSections.find(s => s.id === activeSection) || availableSections[0];
  const totalSteps = allSections.reduce((acc, s) => acc + s.steps.length, 0);
  const completedSteps = progress.completedSteps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="h-full flex flex-col">
      <Title title="Обучение" />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <BookOpen size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Интерактивное руководство</h1>
              <p className="text-blue-100 mt-1">
                Полное обучение работе с системой
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{progressPercent}%</div>
            <div className="text-blue-100 text-sm">
              {completedSteps} из {totalSteps} шагов
            </div>
            <button
              onClick={handleResetProgress}
              className="mt-2 text-xs text-blue-200 hover:text-white underline"
            >
              Сбросить прогресс
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 bg-white/20 rounded-full h-2">
          <div 
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      
      {/* Body */}
      <div className="flex-1 flex overflow-hidden bg-white">
        <SectionSidebar
          sections={allSections}
          activeSection={activeSection}
          onSelect={handleSectionChange}
          userRole={userRole}
          progress={progress}
          onStepClick={handleStepClick}
        />
        
        {currentSection && (
          <SectionContent
            section={currentSection}
            currentStepId={currentStepId}
            progress={progress}
            onMarkComplete={handleMarkComplete}
            onStepChange={setCurrentStepId}
            onNavigate={handleNavigate}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingList;
