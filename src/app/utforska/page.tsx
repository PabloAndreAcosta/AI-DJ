"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Category } from "@/types/destination";
import { filterDestinations } from "@/lib/destinations";
import FilterBar from "@/components/FilterBar";
import DestinationList from "@/components/DestinationList";
import { Map as MapIcon, List } from "lucide-react";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">
      Laddar karta...
    </div>
  ),
});

function UtforskaContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("kategori") as Category | null;

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(
    initialCategory
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"map" | "list">("map");

  const filtered = useMemo(
    () => filterDestinations(query, activeCategory),
    [query, activeCategory]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Utforska destinationer
        </h1>
        <FilterBar
          query={query}
          onQueryChange={setQuery}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
      </div>

      {/* Mobile view toggle */}
      <div className="flex md:hidden gap-2 mb-4">
        <button
          onClick={() => setView("map")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === "map"
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <MapIcon className="w-4 h-4" />
          Karta
        </button>
        <button
          onClick={() => setView("list")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === "list"
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <List className="w-4 h-4" />
          Lista ({filtered.length})
        </button>
      </div>

      <div className="flex gap-6">
        {/* Map */}
        <div
          className={`${
            view === "list" ? "hidden" : "block"
          } md:block w-full md:w-1/2 h-[500px] md:h-[600px]`}
        >
          <Map
            destinations={filtered}
            selectedId={selectedId}
            onSelectDestination={setSelectedId}
          />
        </div>

        {/* List */}
        <div
          className={`${
            view === "map" ? "hidden" : "block"
          } md:block w-full md:w-1/2 md:h-[600px] md:overflow-y-auto`}
        >
          <p className="text-sm text-gray-500 mb-3">
            {filtered.length} destinationer
          </p>
          <DestinationList
            destinations={filtered}
            selectedId={selectedId}
            onSelectDestination={setSelectedId}
          />
        </div>
      </div>
    </div>
  );
}

export default function UtforskaPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-6">Laddar...</div>
      }
    >
      <UtforskaContent />
    </Suspense>
  );
}
