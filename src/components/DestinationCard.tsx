import Link from "next/link";
import { Destination } from "@/types/destination";
import { getCategoryInfo } from "@/data/categories";
import { MapPin, Star } from "lucide-react";

interface DestinationCardProps {
  destination: Destination;
  compact?: boolean;
}

export default function DestinationCard({
  destination,
  compact = false,
}: DestinationCardProps) {
  const category = getCategoryInfo(destination.category);

  return (
    <Link
      href={`/destination/${destination.id}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
    >
      <div className={`relative ${compact ? "h-36" : "h-48"} overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {category && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${category.bgColor} ${category.color}`}
          >
            {category.name}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
          {destination.name}
        </h3>
        {!compact && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {destination.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            {destination.city}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-medium text-gray-700">
              {destination.rating}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
