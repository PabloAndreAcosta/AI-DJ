export type Category = "skatepark" | "aventyrsvarldar" | "naturreservat" | "strand";

export interface Destination {
  id: string;
  name: string;
  description: string;
  category: Category;
  coordinates: {
    lat: number;
    lng: number;
  };
  image: string;
  address: string;
  city: string;
  rating: number;
  tags: string[];
  website: string | null;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}
