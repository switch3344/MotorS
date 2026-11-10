// Content facts are limited to the user's v4.1 brief, attributed to @MSERVICEKRD.
// Unknown case fields remain placeholders until confirmed.
export const metrics = [
  { value: "1396", label: "двигателей в базе", detail: "за последние 5 лет" },
  {
    value: "5 лет",
    label: "или 250 000 км гарантии",
    detail: "на капитальный ремонт",
  },
  {
    value: "D4HE · 1VD-FTV · YD25",
    label: "основные двигатели",
    detail: "Hyundai / Kia · Toyota · Nissan",
  },
  {
    value: "Только оригинальные",
    label: "запчасти",
    detail: "Подделки не ставим.",
  },
];

export const cases = [
  {
    engine: "D4EB",
    car: "Hyundai Santa Fe",
    mileage: "325 000 км",
    found:
      "Компрессия 20 кг/см² при норме 24. Износ 1-го и 2-го цилиндров. Расход масла — 300 г/1000 км.",
    decision: "Капитальный ремонт.",
    done: "{{ВЫПОЛНЕННЫЕ_РАБОТЫ}}",
    warranty: "{{ГАРАНТИЯ_ПО_КЕЙСУ}}",
  },
  {
    engine: "D4HE",
    car: "Kia Carnival",
    mileage: "134 000 км",
    found: "{{ПРИЧИНА_РЕМОНТА}}",
    decision: null,
    done: "Обновили масляную систему. Установили модифицированный корпус воздушного фильтра. Коленвал и шатуны — без замены.",
    warranty: "5 лет или 250 000 км",
  },
  {
    engine: "1VD-FTV",
    car: "Land Cruiser 200",
    mileage: "{{ПРОБЕГ}}",
    found: "{{РЕЗУЛЬТАТЫ_ДЕФЕКТОВКИ}}",
    decision: null,
    done: "Расточка блока. Оригинальные коленвал и масляные насосы. Новая поршневая Teikin и новая ГРМ. Ремонт обеих турбин.",
    warranty: "{{ГАРАНТИЯ_ПО_КЕЙСУ}}",
  },
];

// These workshop albums are separate from the mileage-specific cases above.
export const workPhotos = [
  {
    file: "engine",
    title: "Двигатель",
    alt: "Двигатель D4EB на стойке в мастерской",
    source: "https://t.me/MSERVICEKRD/75",
  },
  {
    file: "crank-and-head",
    title: "Головка блока",
    alt: "Головка блока D4EB и коленвал на рабочем столе",
    source: "https://t.me/MSERVICEKRD/75",
  },
  {
    file: "pistons",
    title: "Поршневая группа",
    alt: "Четыре поршня D4EB на рабочем столе",
    source: "https://t.me/MSERVICEKRD/85",
  },
  {
    file: "valves",
    title: "Клапаны",
    alt: "Клапаны в головке блока D4EB",
    source: "https://t.me/MSERVICEKRD/85",
  },
  {
    file: "piston-detail",
    title: "Детали крупным планом",
    alt: "Поршень в цилиндре D4EB крупным планом",
    source: "https://t.me/MSERVICEKRD/85",
  },
  {
    file: "block",
    title: "Блок цилиндров",
    alt: "Блок D4EB с установленными поршнями",
    source: "https://t.me/MSERVICEKRD/85",
  },
  {
    file: "timing",
    title: "ГРМ",
    alt: "Привод ГРМ двигателя D4EB",
    source: "https://t.me/MSERVICEKRD/85",
  },
  {
    file: "installed",
    title: "Под капотом",
    alt: "Двигатель D4EB в моторном отсеке Hyundai Santa Fe",
    source: "https://t.me/MSERVICEKRD/85",
  },
];
