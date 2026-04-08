"use client";

import { Category } from "@/types/destination";
import { categories } from "@/data/categories";
import { Search, X } from "lucide-react";

interface FilterBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  activeCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
}

export default function FilterBar({
  query,
  onQueryChange,
  activeCategory,
  onCategoryChange,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Sök destinationer..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
        />
        {query && (
          <button
            onClick={() => onQueryChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeCategory === null
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Alla
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() =>
              onCategoryChange(activeCategory === cat.id ? null : cat.id)
            }
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? `${cat.bgColor} ${cat.color}`
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
