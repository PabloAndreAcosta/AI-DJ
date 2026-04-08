"use client";

import { Destination } from "@/types/destination";
import DestinationCard from "@/components/DestinationCard";

interface DestinationListProps {
  destinations: Destination[];
  selectedId?: string | null;
  onSelectDestination?: (id: string) => void;
}

export default function DestinationList({
  destinations,
  selectedId,
  onSelectDestination,
}: DestinationListProps) {
  if (destinations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <p className="text-lg font-medium">Inga destinationer hittades</p>
        <p className="text-sm mt-1">Försök ändra dina sökkriterier</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {destinations.map((dest) => (
        <div
          key={dest.id}
          onClick={() => onSelectDestination?.(dest.id)}
          className={`cursor-pointer rounded-xl transition-all ${
            selectedId === dest.id
              ? "ring-2 ring-emerald-500 ring-offset-2"
              : ""
          }`}
        >
          <DestinationCard destination={dest} compact />
        </div>
      ))}
    </div>
  );
}
