import { Order } from '../types';

export const mockOrders: Order[] = [
  {
    id: "ord-001",
    orderNumber: "ONR-20250115-001",
    date: "2025-01-15T10:30:00.000Z",
    status: "completed",
    customer: {
      name: "Иван Петров",
      phone: "+7 (999) 123-45-67",
      email: "user@example.com",
      region: "ХМАО",
      city: "Сургут",
      address: "ул. Ленина, 1"
    },
    configuration: {
      trailer: {
        id: "mzsa-817701-022",
        model: "МЗСА 817701.022",
        name: "Прицеп для дачи",
        category: "general",
        price: 74700,
        capacity: 550,
        features: ["Оцинкованная рама"],
        availability: "in_stock",
        image: "https://www.mzsa.ru/images/mini/i140140small_IMGP0377%20web.jpg.jpg"
      },
      accessories: [
        {
          id: "acc-002",
          name: "Опорное колесо",
          price: 3500,
          category: "support",
          required: true,
          image: "https://www.mzsa.ru/netcat_files/116/118/h_3708c65658ed9d131c45a36657807c6d",
          description: "Стандартное опорное колесо Ø48",
          compatibleWith: ["all"]
        }
      ],
      totalPrice: 78200
    },
    delivery: {
      method: "pickup",
      region: "ХМАО",
      city: "Сургут"
    },
    timeline: [
      {
        id: "evt-1",
        timestamp: "2025-01-15T10:30:00.000Z",
        status: "new",
        title: "Заказ создан",
        description: "Заказ оформлен на сайте"
      },
      {
        id: "evt-2",
        timestamp: "2025-01-15T11:00:00.000Z",
        status: "processing",
        title: "В работе",
        description: "Менеджер подтвердил заказ",
        user: "Менеджер"
      },
      {
        id: "evt-3",
        timestamp: "2025-01-16T14:00:00.000Z",
        status: "ready",
        title: "Готов к выдаче",
        description: "Заказ ожидает в пункте выдачи"
      },
      {
        id: "evt-4",
        timestamp: "2025-01-17T10:00:00.000Z",
        status: "completed",
        title: "Завершен",
        description: "Заказ выдан клиенту"
      }
    ],
    createdAt: "2025-01-15T10:30:00.000Z",
    updatedAt: "2025-01-17T10:00:00.000Z"
  },
  {
    id: "ord-002",
    orderNumber: "ONR-20250220-042",
    date: "2025-02-20T15:45:00.000Z",
    status: "processing",
    customer: {
      name: "Иван Петров",
      phone: "+7 (999) 123-45-67",
      email: "user@example.com",
      region: "ХМАО",
      city: "Сургут"
    },
    configuration: {
      trailer: {
        id: "mzsa-817717-001",
        name: "МЗСА 817717.001",
        model: "МЗСА 817717.001",
        price: 102000,
        category: "commercial",
        capacity: 490,
        image: "https://www.mzsa.ru/images/mini/i140140small_817717022web.jpg.jpg",
        specs: {
          dimensions: "4791x1992x848 мм",
          capacity: "490 кг",
          weight: "750 кг",
          axles: 1
        },
        features: ["Максимальная длина"],
        availability: "in_stock"
      },
      accessories: [],
      totalPrice: 102000
    },
    delivery: {
      method: "delivery",
      region: "ХМАО",
      city: "Сургут",
      address: "ул. Мира, 15"
    },
    timeline: [
      {
        id: "evt-1",
        timestamp: "2025-02-20T15:45:00.000Z",
        status: "new",
        title: "Заказ создан"
      },
      {
        id: "evt-2",
        timestamp: "2025-02-20T16:00:00.000Z",
        status: "processing",
        title: "В работе",
        user: "Менеджер"
      }
    ],
    createdAt: "2025-02-20T15:45:00.000Z",
    updatedAt: "2025-02-20T16:00:00.000Z"
  }
];
