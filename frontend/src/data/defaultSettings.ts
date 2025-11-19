import { Settings } from '../types';

export const defaultSettings: Settings = {
  contacts: {
    phone: '+7 (3467) 123-45-67',
    email: 'info@o-n-r.ru',
    workHours: 'Пн-Пт: 9:00-18:00, Сб: 10:00-16:00',
    addresses: [
      {
        region: 'ХМАО',
        city: 'Сургут',
        address: 'ул. Промышленная, 10',
        coordinates: [61.25, 73.38]
      },
      {
        region: 'ЯНАО',
        city: 'Новый Уренгой',
        address: 'ул. Индустриальная, 5',
        coordinates: [66.08, 76.68]
      }
    ]
  },
  delivery: {
    regions: [
      {
        name: 'ХМАО',
        cities: ['Сургут', 'Нижневартовск', 'Ханты-Мансийск', 'Нефтеюганск'],
        cost: 5000,
        days: '2-3 дня'
      },
      {
        name: 'ЯНАО',
        cities: ['Новый Уренгой', 'Салехард', 'Ноябрьск', 'Надым'],
        cost: 7000,
        days: '3-5 дней'
      }
    ]
  },
  about: {
    description: 'O-n-r.ru - официальный дилер МЗСА в ХМАО и ЯНАО с 2015 года',
    advantages: [
      'Склад в Сургуте',
      'Доставка по региону',
      'Гарантийное обслуживание',
      'Сертифицированные специалисты'
    ],
    certificates: ['ГОСТ Р ИСО 9001', 'Официальный дилер МЗСА']
  }
};

