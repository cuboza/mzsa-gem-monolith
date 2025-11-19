import { Accessory } from '../types';

export const accessories: Accessory[] = [
  {
    id: "acc-001",
    name: "Лебедка с кронштейном",
    price: 15000,
    category: "loading",
    required: false,
    image: "/api/placeholder/120/80",
    description: "Для загрузки тяжелой техники",
    compatibleWith: ["snowmobile", "boat", "atv"]
  },
  {
    id: "acc-002",
    name: "Опорное колесо",
    price: 3500,
    category: "support",
    required: true,
    image: "/api/placeholder/120/80",
    description: "Стандартное опорное колесо Ø48",
    compatibleWith: ["all"]
  },
  {
    id: "acc-003",
    name: "Держатель запасного колеса",
    price: 2800,
    category: "spare",
    required: false,
    image: "/api/placeholder/120/80",
    description: "Для колес R13, R13C, R14C",
    compatibleWith: ["all"]
  },
  {
    id: "acc-004",
    name: "Тент АЭРО 150 см",
    price: 8500,
    category: "cover",
    required: false,
    image: "/api/placeholder/120/80",
    description: "Водонепроницаемый тент",
    compatibleWith: ["general", "moto"]
  },
  {
    id: "acc-005",
    name: "Противооткатные упоры",
    price: 1200,
    category: "safety",
    required: true,
    image: "/api/placeholder/120/80",
    description: "2 шт. в комплекте",
    compatibleWith: ["all"]
  },
  {
    id: "acc-006",
    name: "Направляющие для снегохода",
    price: 4500,
    category: "guides",
    required: false,
    image: "/api/placeholder/120/80",
    description: "Специальные полозья",
    compatibleWith: ["snowmobile"]
  },
  {
    id: "acc-007",
    name: "Ложементы для лодки",
    price: 6000,
    category: "boat_support",
    required: false,
    image: "/api/placeholder/120/80",
    description: "Мягкие опоры для корпуса",
    compatibleWith: ["boat"]
  },
  {
    id: "acc-008",
    name: "Килевой ролик",
    price: 2500,
    category: "boat_support",
    required: false,
    image: "/api/placeholder/120/80",
    description: "Защита киля при загрузке",
    compatibleWith: ["boat"]
  },
  {
    id: "acc-009",
    name: "Аппарель для заезда",
    price: 12000,
    category: "loading",
    required: false,
    image: "/api/placeholder/120/80",
    description: "Съемная рампа 500 кг",
    compatibleWith: ["atv", "snowmobile"]
  },
  {
    id: "acc-10",
    name: "Упор переднего колеса",
    price: 1800,
    category: "guides",
    required: false,
    image: "/api/placeholder/120/80",
    description: "Фиксатор для мотоциклов",
    compatibleWith: ["atv", "motorcycle"]
  },
  {
    id: "acc-11",
    name: "Держатель штекера",
    price: 800,
    category: "support",
    required: true,
    image: "/api/placeholder/120/80",
    description: "Для подключения электропроводки",
    compatibleWith: ["all"]
  },
  {
    id: "acc-12",
    name: "Страховочные цепи",
    price: 1500,
    category: "safety",
    required: true,
    image: "/api/placeholder/120/80",
    description: "Для безопасности сцепки",
    compatibleWith: ["all"]
  }
];

