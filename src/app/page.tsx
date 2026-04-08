import Link from "next/link";
import { getAllDestinations } from "@/lib/destinations";
import { categories } from "@/data/categories";
import DestinationCard from "@/components/DestinationCard";
import {
  MapPin,
  ArrowRight,
  Zap,
  FerrisWheel,
  Trees,
  Waves,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-8 h-8" />,
  "Ferris Wheel": <FerrisWheel className="w-8 h-8" />,
  Trees: <Trees className="w-8 h-8" />,
  Waves: <Waves className="w-8 h-8" />,
};

export default function Home() {
  const destinations = getAllDestinations();
  const featured = destinations.filter((d) => d.rating >= 4.6).slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-600 to-teal-700 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-200 mb-4">
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wide">
                Utforska Sverige
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              Hitta ditt nästa äventyr i Sverige
            </h1>
            <p className="mt-4 text-lg text-emerald-100 leading-relaxed">
              Upptäck de bästa skateparkerna, äventyrsvärldarna, naturreservaten
              och stränderna runt om i hela Sverige.
            </p>
            <Link
              href="/utforska"
              className="mt-8 inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              Utforska kartan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Utforska kategorier
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/utforska?kategori=${cat.id}`}
              className={`${cat.bgColor} rounded-xl p-6 flex flex-col items-center gap-3 hover:scale-105 transition-transform`}
            >
              <span className={cat.color}>{categoryIcons[cat.icon]}</span>
              <span className="font-semibold text-gray-800 text-center">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Populära destinationer
          </h2>
          <Link
            href="/utforska"
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
          >
            Visa alla <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} />
          ))}
        </div>
      </section>
    </div>
  );
}
