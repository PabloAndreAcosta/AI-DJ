import { CategoryInfo } from "@/types/destination";

export const categories: CategoryInfo[] = [
  {
    id: "skatepark",
    name: "Skateparker",
    icon: "Zap",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    id: "aventyrsvarldar",
    name: "Aventyrsv\u00e4rldar",
    icon: "Ferris Wheel",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    id: "naturreservat",
    name: "Naturreservat",
    icon: "Trees",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "strand",
    name: "Str\u00e4nder & Bad",
    icon: "Waves",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
];

export function getCategoryInfo(categoryId: string): CategoryInfo | undefined {
  return categories.find((c) => c.id === categoryId);
}
