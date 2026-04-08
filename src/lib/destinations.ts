import { Destination, Category } from "@/types/destination";
import destinationsData from "@/data/destinations.json";

const destinations: Destination[] = destinationsData as Destination[];

export function getAllDestinations(): Destination[] {
  return destinations;
}

export function getDestinationById(id: string): Destination | undefined {
  return destinations.find((d) => d.id === id);
}

export function getDestinationsByCategory(category: Category): Destination[] {
  return destinations.filter((d) => d.category === category);
}

export function searchDestinations(query: string): Destination[] {
  const q = query.toLowerCase();
  return destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q) ||
      d.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function filterDestinations(
  query: string,
  categoryFilter: Category | null
): Destination[] {
  let results = destinations;

  if (categoryFilter) {
    results = results.filter((d) => d.category === categoryFilter);
  }

  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return results;
}
