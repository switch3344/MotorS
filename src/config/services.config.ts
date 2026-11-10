export type Vec3 = [number, number, number];
export type EngineZone =
  "all" | "block" | "heads" | "pistons" | "timing" | "oil";
export interface ProxyZone {
  center: Vec3;
  size: Vec3;
  meshZones: string[];
}
export interface Service {
  id: string;
  number: string;
  name: string;
  description: string;
  zone: EngineZone;
  proxy?: ProxyZone;
  cameraZoom: number;
  pistonLift?: number;
  steps: [string, string, string];
  price: string;
  days: string;
}
export const engineConfig = {
  modelUrl: `${import.meta.env.BASE_URL}models/ls-v8.glb`,
  camera: [6.6, 4.2, 7.8] as Vec3,
  cameraTarget: [0, 0, 0] as Vec3,
  attribution: {
    author: "{{MODEL_AUTHOR}}",
    license: "{{MODEL_LICENSE}}",
    url: "https://sketchfab.com/3d-models/supercharged-ls-v8-engine-1-6e920e47959d4da797eff437beeaa3f3",
  },
};
// Draft catalogue. Bounding boxes approximate missing assemblies without changing the source geometry.
export const services: Service[] = [
  {
    id: "diagnostics",
    number: "01",
    name: "Диагностика",
    description: "Проверим состояние двигателя и найдём причину неисправности.",
    zone: "all",
    cameraZoom: 1,
    steps: ["Проверка двигателя", "Разбор результатов", "Согласование работ"],
    price: "{{PRICE}}",
    days: "{{DAYS}}",
  },
  {
    id: "overhaul",
    number: "02",
    name: "Капитальный ремонт",
    description:
      "Разберём двигатель и согласуем восстановление изношенных деталей.",
    zone: "block",
    cameraZoom: 1.08,
    steps: [
      "Разборка и дефектовка",
      "Восстановление деталей",
      "Сборка и проверка",
    ],
    price: "{{PRICE}}",
    days: "{{DAYS}}",
  },
  {
    id: "heads",
    number: "03",
    name: "Ремонт ГБЦ",
    description: "Проверим головку блока и восстановим клапанный механизм.",
    zone: "heads",
    cameraZoom: 1.08,
    steps: ["Разборка головки", "Проверка и ремонт", "Контроль сборки"],
    price: "{{PRICE}}",
    days: "{{DAYS}}",
  },
  {
    id: "pistons",
    number: "04",
    name: "Ремонт поршней",
    description:
      "Проверим цилиндры, поршни и кольца. Подберём ремонт по замерам.",
    zone: "pistons",
    proxy: {
      center: [0, -0.05, 0],
      size: [1.8, 1.35, 2.5],
      meshZones: ["block"],
    },
    pistonLift: 0.22,
    cameraZoom: 1.04,
    steps: ["Измерение цилиндров", "Подбор компонентов", "Сборка и контроль"],
    price: "{{PRICE}}",
    days: "{{DAYS}}",
  },
  {
    id: "timing",
    number: "05",
    name: "Ремонт ГРМ",
    description:
      "Проверим привод газораспределения и восстановим точность фаз.",
    zone: "timing",
    cameraZoom: 1.06,
    steps: ["Проверка привода", "Замена компонентов", "Контроль фаз"],
    price: "{{PRICE}}",
    days: "{{DAYS}}",
  },
  {
    id: "oil",
    number: "06",
    name: "Масляная система",
    description: "Найдём причину потери давления и проверим систему смазки.",
    zone: "oil",
    proxy: {
      center: [0, -1.1, 0.05],
      size: [1.8, 0.9, 2.8],
      meshZones: ["oil"],
    },
    cameraZoom: 1.04,
    steps: ["Проверка давления", "Ремонт системы", "Контроль работы"],
    price: "{{PRICE}}",
    days: "{{DAYS}}",
  },
];
