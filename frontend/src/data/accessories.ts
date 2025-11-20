import { Accessory } from '../types';

export const accessories: Accessory[] = [
  {
    id: "acc-001",
    name: "Лебедка с кронштейном",
    price: 15000,
    category: "loading",
    required: false,
    image: "https://www.mzsa.ru/netcat_files/116/118/h_8b3aefb513c5a8a3431f57b1d4d767e3", // Using bracket image as placeholder
    description: "Для загрузки тяжелой техники",
    compatibleWith: ["snowmobile", "boat", "atv"]
  },
  {
    id: "acc-002",
    name: "Опорное колесо",
    price: 3500,
    category: "support",
    required: true,
    image: "https://www.mzsa.ru/netcat_files/116/118/h_3708c65658ed9d131c45a36657807c6d",
    description: "Стандартное опорное колесо Ø48",
    compatibleWith: ["all"]
  },
  {
    id: "acc-003",
    name: "Держатель запасного колеса",
    price: 2800,
    category: "spare",
    required: false,
    image: "https://www.mzsa.ru/netcat_files/116/118/h_47058cedcb5e16ed415b7380d8eab6d8",
    description: "Для колес R13, R13C, R14C",
    compatibleWith: ["all"]
  },
  {
    id: "acc-004",
    name: "Тент АЭРО 150 см",
    price: 8500,
    category: "cover",
    required: false,
    image: "https://www.mzsa.ru/netcat_files/116/118/h_c348d5ee650ef1ac0f3b95d7b55aadd6",
    description: "Водонепроницаемый тент",
    compatibleWith: ["general", "moto"]
  },
  {
    id: "acc-005",
    name: "Противооткатные упоры",
    price: 1200,
    category: "safety",
    required: true,
    image: "https://placehold.co/300x200?text=Упоры",
    description: "2 шт. в комплекте",
    compatibleWith: ["all"]
  },
  {
    id: "acc-006",
    name: "Направляющие для снегохода",
    price: 4500,
    category: "guides",
    required: false,
    image: "https://placehold.co/300x200?text=Направляющие",
    description: "Специальные полозья",
    compatibleWith: ["snowmobile"]
  },
  {
    id: "acc-007",
    name: "Ложементы для лодки",
    price: 6000,
    category: "boat_support",
    required: false,
    image: "https://placehold.co/300x200?text=Ложементы",
    description: "Мягкие опоры для корпуса",
    compatibleWith: ["boat"]
  },
  {
    id: "acc-008",
    name: "Килевой ролик",
    price: 2500,
    category: "boat_support",
    required: false,
    image: "https://placehold.co/300x200?text=Ролик",
    description: "Защита киля при загрузке",
    compatibleWith: ["boat"]
  },
  {
    id: "acc-009",
    name: "Аппарель для заезда",
    price: 12000,
    category: "loading",
    required: false,
    image: "https://www.mzsa.ru/netcat_files/116/118/h_922b310b478c33861971b862b92a8ab1", // Using side board image as placeholder for ramp
    description: "Съемная рампа 500 кг",
    compatibleWith: ["atv", "snowmobile"]
  },
  {
    id: "acc-10",
    name: "Упор переднего колеса",
    price: 1800,
    category: "guides",
    required: false,
    image: "https://placehold.co/300x200?text=Упор+колеса",
    description: "Фиксатор для мотоциклов",
    compatibleWith: ["atv", "motorcycle"]
  },
  {
    id: "acc-11",
    name: "Держатель штекера",
    price: 800,
    category: "support",
    required: true,
    image: "https://placehold.co/300x200?text=Штекер",
    description: "Для подключения электропроводки",
    compatibleWith: ["all"]
  },
  {
    id: "acc-12",
    name: "Страховочные цепи",
    price: 1500,
    category: "safety",
    required: true,
    image: "https://placehold.co/300x200?text=Цепи",
    description: "Для безопасности сцепки",
    compatibleWith: ["all"]
  }
];

