/**
 * Интерактивный онбординг и мануал для админ-панели
 * 
 * Включает Happy Path для:
 * - Посетителя сайта (публичная часть)
 * - Покупателя (регистрация, заказ)
 * - Менеджера (обработка заказов, работа с клиентами)
 * - Администратора (полное управление системой)
 */

import { useState, useEffect } from 'react';
import { usePermissions, useRedirect } from 'react-admin';
import { 
  X, 
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
  Globe,
  Home,
  ExternalLink,
  Lock,
  UserPlus,
  Store,
  Wrench,
  Boxes,
  LayoutDashboard
} from 'lucide-react';

// Ключи для localStorage
const ONBOARDING_KEY = 'admin_onboarding_v2_completed';
const ONBOARDING_SECTION_KEY = 'admin_onboarding_v2_section';

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
      description: 'Первое впечатление клиента',
      icon: Home,
      content: (
        <div className="space-y-4">
          <p>Клиент попадает на главную страницу, где видит:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong>Hero-карусель</strong> — яркие баннеры с акциями и новинками</li>
            <li><strong>Популярные прицепы</strong> — топ-продажи с ценами</li>
            <li><strong>Преимущества компании</strong> — почему выбирают нас</li>
            <li><strong>Карта магазинов</strong> — ближайшие точки продаж</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Для админа:</strong> Hero-карусель настраивается в разделе "Hero-карусель". 
              Добавляйте сезонные акции и новые модели.
            </p>
          </div>
        </div>
      ),
      tips: [
        'Обновляйте Hero-карусель к сезону (лето — лодочные, зима — для снегоходов)',
        'Популярные прицепы определяются автоматически по продажам'
      ]
    },
    {
      id: 'visitor-2',
      title: 'Каталог прицепов',
      description: 'Поиск и фильтрация',
      icon: Search,
      content: (
        <div className="space-y-4">
          <p>В каталоге клиент может:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong>Фильтровать</strong> по категории (бортовые, лодочные, коммерческие)</li>
            <li><strong>Искать</strong> по названию, модели или характеристикам</li>
            <li><strong>Сортировать</strong> по цене, популярности</li>
            <li><strong>Умный поиск</strong> — "прицеп для лодки 5 метров" найдёт подходящие</li>
          </ul>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Важно:</strong> Прицепы с галочкой "Скрыть на сайте" (isVisible=false) 
              не показываются в каталоге. Используйте это для снятых с продажи моделей.
            </p>
          </div>
        </div>
      ),
      tips: [
        'Прицепы с stock=0 показываются как "Нет в наличии"',
        'Умный поиск понимает размеры в метрах, см и мм'
      ],
      relatedPath: '/admin/trailers'
    },
    {
      id: 'visitor-3',
      title: 'Конфигуратор',
      description: 'Подбор по типу техники',
      icon: Wrench,
      content: (
        <div className="space-y-4">
          <p>Конфигуратор помогает подобрать прицеп под технику:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li><strong>Выбор техники</strong> — лодка, снегоход, квадроцикл, авто, груз</li>
            <li><strong>Указание размеров</strong> — длина, ширина, вес техники</li>
            <li><strong>Подбор прицепа</strong> — система показывает совместимые</li>
            <li><strong>Выбор опций</strong> — дополнительное оборудование</li>
            <li><strong>Оформление заявки</strong> — контактные данные</li>
          </ol>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>✅ Совместимость:</strong> Определяется полями maxVehicleLength, 
              maxVehicleWidth, maxVehicleWeight в карточке прицепа.
            </p>
          </div>
        </div>
      ),
      tips: [
        'Заполняйте поля max_vehicle_* для корректной работы конфигуратора',
        'Категория прицепа определяет доступные типы техники'
      ],
      relatedPath: '/admin/trailers'
    },
    {
      id: 'visitor-4',
      title: 'Карточка прицепа',
      description: 'Детальная информация',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>На странице прицепа клиент видит:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong>Галерея фото</strong> — с возможностью увеличения</li>
            <li><strong>Цена</strong> — текущая, старая (если скидка)</li>
            <li><strong>Характеристики</strong> — размеры, грузоподъёмность, тип подвески</li>
            <li><strong>Описание</strong> — подробности о модели</li>
            <li><strong>Доступные опции</strong> — аксессуары с выбором количества</li>
            <li><strong>Наличие</strong> — статус на складе (галочка/крестик)</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📦 Умные остатки:</strong> Клиент не может выбрать опций больше, 
              чем есть на складе. Точное количество скрыто, но система блокирует лишнее.
            </p>
          </div>
        </div>
      ),
      tips: [
        'Качественные фото увеличивают конверсию',
        'Подробное описание снижает нагрузку на менеджеров'
      ]
    }
  ]
};

// Happy Path: Покупатель
const buyerHappyPath: TutorialSection = {
  id: 'buyer',
  title: 'Путь покупателя',
  description: 'От выбора до получения заказа',
  icon: ShoppingCart,
  color: 'text-green-600',
  bgColor: 'bg-green-50',
  borderColor: 'border-green-200',
  availableFor: ['admin', 'manager'],
  steps: [
    {
      id: 'buyer-1',
      title: 'Регистрация / Авторизация',
      description: 'Создание аккаунта покупателя',
      icon: UserPlus,
      content: (
        <div className="space-y-4">
          <p>Покупатель может:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong>Зарегистрироваться</strong> — email, телефон, пароль</li>
            <li><strong>Войти через Supabase Auth</strong> — безопасная авторизация</li>
            <li><strong>Оформить без регистрации</strong> — только контактные данные</li>
          </ul>
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800">
              <strong>🔐 Supabase Auth:</strong> Все пользователи хранятся в auth.users, 
              а данные профиля в app_users с привязкой по auth_user_id.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'buyer-2',
      title: 'Оформление заказа',
      description: 'Процесс покупки',
      icon: ClipboardList,
      content: (
        <div className="space-y-4">
          <p>Шаги оформления заказа:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li><strong>Выбор прицепа</strong> — из каталога или конфигуратора</li>
            <li><strong>Добавление опций</strong> — тент, колёса, лебёдка и т.д.</li>
            <li><strong>Контактные данные</strong> — ФИО, телефон, email, город</li>
            <li><strong>Способ получения</strong> — самовывоз или доставка</li>
            <li><strong>Подтверждение</strong> — создание заявки</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📦 Резервирование:</strong> При создании заказа система автоматически 
              резервирует остатки (available_quantity уменьшается, reserved_quantity увеличивается).
            </p>
          </div>
        </div>
      ),
      tips: [
        'Заказ создаётся в статусе "Новый"',
        'Менеджер получает уведомление о новом заказе',
        'Email подтверждения отправляется автоматически'
      ],
      relatedPath: '/admin/orders'
    },
    {
      id: 'buyer-3',
      title: 'Отслеживание заказа',
      description: 'Проверка статуса',
      icon: Eye,
      content: (
        <div className="space-y-4">
          <p>Покупатель может отслеживать заказ:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong>По номеру заказа</strong> — на странице /track-order</li>
            <li><strong>В личном кабинете</strong> — история всех заказов</li>
            <li><strong>По email</strong> — уведомления об изменении статуса</li>
          </ul>
          <div className="mt-4">
            <p className="font-medium mb-2">Статусы заказа:</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Новый</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">В работе</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">В производстве</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Готов</span>
              <span className="text-gray-400">→</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">Завершён</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'buyer-4',
      title: 'Получение заказа',
      description: 'Финальный этап',
      icon: Truck,
      content: (
        <div className="space-y-4">
          <p>Способы получения:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <Store size={18} /> Самовывоз
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Из магазина в Сургуте, Нижневартовске, Ноябрьске или Новом Уренгое
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium flex items-center gap-2">
                <Truck size={18} /> Доставка
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Транспортной компанией в любой город ХМАО и ЯНАО
              </p>
            </div>
          </div>
        </div>
      )
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
      title: 'Рабочий день менеджера',
      description: 'С чего начать',
      icon: LayoutDashboard,
      content: (
        <div className="space-y-4">
          <p>Начало рабочего дня:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li><strong>Откройте Dashboard</strong> — увидите новые заказы и статистику</li>
            <li><strong>Проверьте новые заказы</strong> — отфильтруйте по статусу "Новый"</li>
            <li><strong>Проверьте остатки</strong> — виджет "Мало на складе"</li>
            <li><strong>Обработайте приоритетные заказы</strong> — по дате или сумме</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📊 Dashboard:</strong> Показывает ключевые метрики — новые заказы, 
              выручку за месяц, заказы в работе, низкие остатки.
            </p>
          </div>
        </div>
      ),
      tips: [
        'Проверяйте Dashboard каждое утро',
        'Обрабатывайте новые заказы в течение 2 часов'
      ],
      relatedPath: '/admin'
    },
    {
      id: 'manager-2',
      title: 'Обработка нового заказа',
      description: 'Пошаговая инструкция',
      icon: ShoppingCart,
      content: (
        <div className="space-y-4">
          <p className="font-medium">Алгоритм обработки:</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <p className="font-medium">Проверьте данные заказа</p>
                <p className="text-sm text-gray-600">Прицеп, опции, контакты клиента, способ доставки</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <p className="font-medium">Свяжитесь с клиентом</p>
                <p className="text-sm text-gray-600">Подтвердите заказ, уточните детали, согласуйте сроки</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <p className="font-medium">Измените статус на "В работе"</p>
                <p className="text-sm text-gray-600">Это сигнал что заказ принят в обработку</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0">4</div>
              <div>
                <p className="font-medium">Отметьте оплату</p>
                <p className="text-sm text-gray-600">Предоплата или полная оплата — обновите статус платежа</p>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        'Звоните в течение 30 минут после получения заказа',
        'Фиксируйте договорённости в комментариях к заказу'
      ],
      warnings: [
        'Не меняйте статус без подтверждения от клиента'
      ],
      relatedPath: '/admin/orders'
    },
    {
      id: 'manager-3',
      title: 'Жизненный цикл заказа',
      description: 'Все статусы и переходы',
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <p className="font-medium">Статусы и их значение:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 border-l-4 border-blue-500 bg-blue-50">
              <span className="font-medium w-32">Новый</span>
              <span className="text-sm text-gray-600">Заказ только что создан, ждёт обработки</span>
            </div>
            <div className="flex items-center gap-3 p-2 border-l-4 border-yellow-500 bg-yellow-50">
              <span className="font-medium w-32">В работе</span>
              <span className="text-sm text-gray-600">Менеджер взял в работу, подтвердил с клиентом</span>
            </div>
            <div className="flex items-center gap-3 p-2 border-l-4 border-purple-500 bg-purple-50">
              <span className="font-medium w-32">В производстве</span>
              <span className="text-sm text-gray-600">Прицеп на комплектации или в пути от завода</span>
            </div>
            <div className="flex items-center gap-3 p-2 border-l-4 border-green-500 bg-green-50">
              <span className="font-medium w-32">Готов</span>
              <span className="text-sm text-gray-600">Прицеп готов к выдаче, клиент оповещён</span>
            </div>
            <div className="flex items-center gap-3 p-2 border-l-4 border-gray-500 bg-gray-50">
              <span className="font-medium w-32">Завершён</span>
              <span className="text-sm text-gray-600">Клиент получил заказ, сделка закрыта</span>
            </div>
            <div className="flex items-center gap-3 p-2 border-l-4 border-red-500 bg-red-50">
              <span className="font-medium w-32">Отменён</span>
              <span className="text-sm text-gray-600">Заказ отменён, остатки возвращены на склад</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Остатки:</strong> При отмене заказа зарезервированные товары 
              автоматически возвращаются в доступные (reserved → available).
            </p>
          </div>
        </div>
      ),
      tips: [
        'При переходе в "Завершён" остатки списываются окончательно',
        'Отменённые заказы сохраняются для статистики'
      ]
    },
    {
      id: 'manager-4',
      title: 'Работа с клиентами',
      description: 'Ведение базы клиентов',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p>Управление клиентами:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Просмотр истории</strong> — все заказы клиента в одном месте</li>
            <li><strong>Обновление контактов</strong> — телефон, email, адрес</li>
            <li><strong>Добавление заметок</strong> — особые пожелания, договорённости</li>
            <li><strong>Поиск клиента</strong> — по имени, телефону или email</li>
          </ul>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>💡 Совет:</strong> Регулярно обновляйте контакты клиентов. 
              Это поможет в повторных продажах и маркетинге.
            </p>
          </div>
        </div>
      ),
      relatedPath: '/admin/customers'
    },
    {
      id: 'manager-5',
      title: 'Консультации по телефону',
      description: 'Как помочь клиенту с выбором',
      icon: Phone,
      content: (
        <div className="space-y-4">
          <p className="font-medium">Алгоритм консультации:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li><strong>Выясните потребность</strong> — что будет перевозить?</li>
            <li><strong>Уточните параметры техники</strong> — длина, ширина, вес</li>
            <li><strong>Откройте каталог</strong> — подберите 2-3 варианта</li>
            <li><strong>Расскажите о преимуществах</strong> — МЗСА, гарантия, опции</li>
            <li><strong>Предложите запись</strong> — визит в магазин или оформление онлайн</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📋 Подсказка:</strong> Используйте конфигуратор вместе с клиентом — 
              введите параметры его техники и покажите подходящие прицепы.
            </p>
          </div>
        </div>
      ),
      tips: [
        'Всегда уточняйте вес техники — это критично для выбора',
        'Предлагайте опции после основного выбора'
      ]
    }
  ]
};

// Happy Path: Администратор
const adminHappyPath: TutorialSection = {
  id: 'admin',
  title: 'Работа администратора',
  description: 'Управление системой, каталогом и настройками',
  icon: Shield,
  color: 'text-red-600',
  bgColor: 'bg-red-50',
  borderColor: 'border-red-200',
  availableFor: ['admin'],
  steps: [
    {
      id: 'admin-1',
      title: 'Управление каталогом',
      description: 'Добавление и редактирование прицепов',
      icon: Package,
      content: (
        <div className="space-y-4">
          <p className="font-medium">Добавление нового прицепа:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li><strong>Прицепы → Создать</strong></li>
            <li>Заполните <strong>модель и название</strong></li>
            <li>Укажите <strong>категорию</strong> (бортовой, лодочный, коммерческий)</li>
            <li>Установите <strong>цену</strong> (retail_price)</li>
            <li>Загрузите <strong>фотографии</strong></li>
            <li>Заполните <strong>характеристики</strong> (размеры, вес, оси)</li>
            <li>Укажите <strong>max_vehicle_*</strong> для конфигуратора</li>
            <li><strong>Сохраните</strong></li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Видимость:</strong> Новый прицеп по умолчанию видим на сайте. 
              Снимите галочку "Показывать на сайте" для скрытия.
            </p>
          </div>
        </div>
      ),
      tips: [
        'Slug генерируется автоматически из модели',
        'Используйте качественные фото минимум 800x600 px'
      ],
      relatedPath: '/admin/trailers/create'
    },
    {
      id: 'admin-2',
      title: 'Управление остатками',
      description: 'Складской учёт',
      icon: Boxes,
      content: (
        <div className="space-y-4">
          <p className="font-medium">Структура остатков:</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border text-left">Поле</th>
                  <th className="px-3 py-2 border text-left">Описание</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 border font-mono">quantity</td>
                  <td className="px-3 py-2 border">Общее количество на складе</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border font-mono">available_quantity</td>
                  <td className="px-3 py-2 border">Доступно для продажи</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 border font-mono">reserved_quantity</td>
                  <td className="px-3 py-2 border">Зарезервировано в заказах</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📦 Формула:</strong> quantity = available_quantity + reserved_quantity
            </p>
            <p className="text-sm text-blue-800 mt-2">
              <strong>На сайте:</strong> Пользователь видит только наличие (есть/нет). 
              Выбор количества ограничен полем <code>available_quantity</code>.
            </p>
          </div>
            </p>
          </div>
          <p className="mt-4 font-medium">Автоматические операции:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong>Новый заказ:</strong> available↓ reserved↑</li>
            <li><strong>Отмена заказа:</strong> available↑ reserved↓</li>
            <li><strong>Завершение заказа:</strong> quantity↓ reserved↓</li>
          </ul>
        </div>
      ),
      relatedPath: '/admin/warehouses'
    },
    {
      id: 'admin-3',
      title: 'Импорт из 1С',
      description: 'Синхронизация данных',
      icon: Upload,
      content: (
        <div className="space-y-4">
          <p className="font-medium">Процесс обмена с 1С:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li><strong>Экспорт из 1С</strong> — выгрузка номенклатуры в JSON/XML</li>
            <li><strong>Загрузка в админку</strong> — раздел "Импорт 1С"</li>
            <li><strong>Сопоставление</strong> — привязка по GUID или артикулу</li>
            <li><strong>Проверка</strong> — предпросмотр изменений</li>
            <li><strong>Применение</strong> — обновление базы</li>
          </ol>
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800">
              <strong>🔗 GUID 1C:</strong> Каждая запись имеет поле guid_1c для связи 
              с номенклатурой в 1С. Это обеспечивает точную синхронизацию.
            </p>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Важно:</strong> Перед импортом сделайте резервную копию базы!
            </p>
          </div>
        </div>
      ),
      warnings: [
        'Всегда делайте бэкап перед импортом',
        'Проверяйте предпросмотр перед применением'
      ],
      relatedPath: '/admin/import-1c'
    },
    {
      id: 'admin-4',
      title: 'Управление пользователями',
      description: 'Создание и настройка аккаунтов',
      icon: Users,
      content: (
        <div className="space-y-4">
          <p className="font-medium">Создание нового менеджера:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li><strong>Пользователи → Создать</strong></li>
            <li>Укажите <strong>логин</strong> (уникальный)</li>
            <li>Задайте <strong>пароль</strong> (мин. 6 символов)</li>
            <li>Введите <strong>полное имя</strong></li>
            <li>Выберите <strong>роль</strong> — Менеджер или Администратор</li>
            <li>Установите <strong>Активен = Да</strong></li>
            <li><strong>Сохраните</strong></li>
          </ol>
          <div className="mt-4">
            <p className="font-medium mb-2">Права ролей:</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Менеджер</h4>
                <ul className="text-sm text-blue-700 mt-1">
                  <li>✓ Заказы (просмотр, редактирование)</li>
                  <li>✓ Клиенты (просмотр, редактирование)</li>
                  <li>✓ Каталог (только просмотр)</li>
                  <li>✗ Пользователи</li>
                  <li>✗ Настройки системы</li>
                </ul>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800">Администратор</h4>
                <ul className="text-sm text-red-700 mt-1">
                  <li>✓ Всё что у менеджера</li>
                  <li>✓ Редактирование каталога</li>
                  <li>✓ Управление пользователями</li>
                  <li>✓ Настройки системы</li>
                  <li>✓ Бэкап и импорт</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
      tips: [
        'Используйте сложные пароли',
        'Деактивируйте уволенных сотрудников вместо удаления'
      ],
      relatedPath: '/admin/users'
    },
    {
      id: 'admin-5',
      title: 'Hero-карусель',
      description: 'Управление баннерами на главной',
      icon: Image,
      content: (
        <div className="space-y-4">
          <p className="font-medium">Добавление слайда:</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li><strong>Hero-карусель → Создать</strong></li>
            <li>Загрузите <strong>изображение</strong> (рекомендуется 1920x600 px)</li>
            <li>Укажите <strong>заголовок</strong> и <strong>подзаголовок</strong></li>
            <li>Добавьте <strong>кнопку</strong> с ссылкой (опционально)</li>
            <li>Установите <strong>порядок сортировки</strong></li>
            <li>Отметьте <strong>Активен</strong> для отображения</li>
          </ol>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>💡 Совет:</strong> Обновляйте баннеры к сезону — 
              весна/лето для лодочных прицепов, осень/зима для снегоходных.
            </p>
          </div>
        </div>
      ),
      tips: [
        'Используйте изображения без мелкого текста',
        'Не более 5 активных слайдов'
      ],
      relatedPath: '/admin/hero-slides'
    },
    {
      id: 'admin-6',
      title: 'Управление магазинами',
      description: 'Филиалы и контакты',
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <p>В разделе "Магазины" управляйте:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li><strong>Адреса филиалов</strong> — отображаются на карте и в контактах</li>
            <li><strong>Режим работы</strong> — часы работы каждого магазина</li>
            <li><strong>Телефоны</strong> — контакты для связи</li>
            <li><strong>Координаты</strong> — для отображения на карте</li>
          </ul>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📍 Координаты:</strong> Укажите широту и долготу для корректного 
              отображения на карте. Используйте Яндекс.Карты для определения.
            </p>
          </div>
        </div>
      ),
      relatedPath: '/admin/stores'
    },
    {
      id: 'admin-7',
      title: 'Резервное копирование',
      description: 'Защита данных',
      icon: Database,
      content: (
        <div className="space-y-4">
          <p className="font-medium">Регулярно делайте бэкапы:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Ежедневно</strong> — автоматически в Supabase</li>
            <li><strong>Перед импортом</strong> — вручную через "Бэкап"</li>
            <li><strong>Перед обновлениями</strong> — страховка от ошибок</li>
          </ul>
          <div className="mt-4 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>⚠️ Критично:</strong> Храните копии бэкапов в нескольких местах. 
              Облачное хранилище + локальная копия.
            </p>
          </div>
          <p className="mt-4 font-medium">Что включает бэкап:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Все прицепы и опции</li>
            <li>Заказы и клиенты</li>
            <li>Настройки системы</li>
            <li>Пользователи (без паролей)</li>
          </ul>
        </div>
      ),
      warnings: [
        'Бэкап не включает загруженные изображения',
        'Восстановление перезаписывает все данные'
      ],
      relatedPath: '/admin/backup'
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

// Компонент шага туториала
const TutorialStepView = ({ 
  step, 
  isExpanded, 
  onToggle,
  onNavigate 
}: { 
  step: TutorialStep; 
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
}) => {
  const Icon = step.icon;

  return (
    <div className={`border rounded-lg transition-all ${isExpanded ? 'border-blue-300 shadow-md' : 'hover:border-gray-300'}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className={`p-2 rounded-lg ${isExpanded ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <Icon size={20} className={isExpanded ? 'text-blue-600' : 'text-gray-600'} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{step.title}</h4>
          <p className="text-sm text-gray-500">{step.description}</p>
        </div>
        <ChevronDown 
          size={20} 
          className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t">
          <div className="pt-4">
            {step.content}
          </div>

          {step.tips && step.tips.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <h5 className="font-medium text-green-800 flex items-center gap-2 text-sm">
                <Lightbulb size={16} />
                Советы
              </h5>
              <ul className="mt-2 space-y-1">
                {step.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.warnings && step.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <h5 className="font-medium text-red-800 flex items-center gap-2 text-sm">
                <AlertTriangle size={16} />
                Предупреждения
              </h5>
              <ul className="mt-2 space-y-1">
                {step.warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <XCircle size={14} className="mt-0.5 flex-shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {step.relatedPath && (
            <div className="mt-4">
              <button
                onClick={() => onNavigate(step.relatedPath!)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <ExternalLink size={16} />
                Перейти к разделу
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Сайдбар с секциями
const SectionSidebar = ({
  sections,
  activeSection,
  onSelect,
  userRole
}: {
  sections: TutorialSection[];
  activeSection: string;
  onSelect: (id: string) => void;
  userRole: 'admin' | 'manager';
}) => {
  const availableSections = sections.filter(s => s.availableFor.includes(userRole));

  return (
    <div className="w-64 bg-gray-50 border-r overflow-y-auto">
      <div className="p-4">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wider mb-3">
          Разделы мануала
        </h3>
        <nav className="space-y-1">
          {availableSections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => onSelect(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  isActive 
                    ? `${section.bgColor} ${section.color} font-medium` 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm">{section.title}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Роль:</strong> {userRole === 'admin' ? 'Администратор' : 'Менеджер'}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {userRole === 'admin' 
              ? 'Доступны все разделы' 
              : 'Некоторые разделы недоступны'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Контент секции
const SectionContent = ({
  section,
  onNavigate
}: {
  section: TutorialSection;
  onNavigate: (path: string) => void;
}) => {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const Icon = section.icon;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Заголовок секции */}
      <div className={`${section.bgColor} px-6 py-4 border-b ${section.borderColor}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 bg-white rounded-lg shadow-sm`}>
            <Icon size={28} className={section.color} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
            <p className="text-sm text-gray-600">{section.description}</p>
          </div>
        </div>
      </div>

      {/* Шаги */}
      <div className="p-6 space-y-3">
        {section.steps.map((step) => (
          <TutorialStepView
            key={step.id}
            step={step}
            isExpanded={expandedStep === step.id}
            onToggle={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
};

// =====================================================
// ОСНОВНОЙ КОМПОНЕНТ
// =====================================================

export const Onboarding = () => {
  const { permissions } = usePermissions();
  const redirect = useRedirect();
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('visitor');

  const userRole = (permissions as 'admin' | 'manager') || 'manager';

  useEffect(() => {
    // Проверяем был ли онбординг уже показан
    const completed = localStorage.getItem(ONBOARDING_KEY);
    const savedSection = localStorage.getItem(ONBOARDING_SECTION_KEY);
    
    if (!completed) {
      setIsVisible(true);
    }
    
    if (savedSection) {
      setActiveSection(savedSection);
    }
  }, []);

  // Сохраняем выбранную секцию
  useEffect(() => {
    localStorage.setItem(ONBOARDING_SECTION_KEY, activeSection);
  }, [activeSection]);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsVisible(false);
  };

  const handleReset = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setIsVisible(true);
  };

  const handleNavigate = (path: string) => {
    handleClose();
    redirect(path);
  };

  const currentSection = allSections.find(s => s.id === activeSection) || allSections[0];
  const availableSections = allSections.filter(s => s.availableFor.includes(userRole));

  if (!isVisible) {
    return (
      <button
        onClick={handleReset}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 group"
        title="Открыть мануал"
      >
        <BookOpen size={24} />
        <span className="absolute right-full mr-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Открыть мануал
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-white" />
            <div>
              <h1 className="text-xl font-bold text-white">Интерактивный мануал</h1>
              <p className="text-sm text-blue-100">
                Полное руководство по работе с системой
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <SectionSidebar
            sections={allSections}
            activeSection={activeSection}
            onSelect={setActiveSection}
            userRole={userRole}
          />

          {/* Content */}
          {availableSections.find(s => s.id === activeSection) ? (
            <SectionContent
              section={currentSection}
              onNavigate={handleNavigate}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center p-8">
                <Lock size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700">Раздел недоступен</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Этот раздел доступен только администраторам
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              Нажмите <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">?</kbd> или 
              кнопку <BookOpen size={12} className="inline" /> для повторного открытия
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Закрыть
            </button>
            <button
              onClick={() => {
                const currentIndex = availableSections.findIndex(s => s.id === activeSection);
                if (currentIndex < availableSections.length - 1) {
                  setActiveSection(availableSections[currentIndex + 1].id);
                } else {
                  handleClose();
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
            >
              {availableSections.findIndex(s => s.id === activeSection) < availableSections.length - 1 
                ? <>Далее <ArrowRight size={16} /></> 
                : 'Начать работу'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
