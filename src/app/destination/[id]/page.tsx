import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllDestinations, getDestinationById } from "@/lib/destinations";
import { getCategoryInfo } from "@/data/categories";
import { ArrowLeft, MapPin, Star, ExternalLink } from "lucide-react";

export function generateStaticParams() {
  return getAllDestinations().map((d) => ({ id: d.id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DestinationPage({ params }: PageProps) {
  const { id } = await params;
  const destination = getDestinationById(id);

  if (!destination) {
    notFound();
  }

  const category = getCategoryInfo(destination.category);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/utforska"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till utforska
      </Link>

      {/* Image */}
      <div className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        {category && (
          <span
            className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-semibold ${category.bgColor} ${category.color}`}
          >
            {category.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {destination.name}
          </h1>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="w-4 h-4" />
              <span>{destination.address}, {destination.city}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-gray-700">
                {destination.rating}
              </span>
            </div>
          </div>
        </div>

        <p className="text-gray-600 leading-relaxed text-lg">
          {destination.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {destination.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Website link */}
        {destination.website && (
          <a
            href={destination.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Besök webbplats
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Mini map */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Plats</h2>
          <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${destination.coordinates.lng - 0.05}%2C${destination.coordinates.lat - 0.03}%2C${destination.coordinates.lng + 0.05}%2C${destination.coordinates.lat + 0.03}&layer=mapnik&marker=${destination.coordinates.lat}%2C${destination.coordinates.lng}`}
              className="w-full h-full border-0"
              title={`Karta för ${destination.name}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
