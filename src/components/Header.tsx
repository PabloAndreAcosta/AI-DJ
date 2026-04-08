"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Menu, X } from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <MapPin className="w-6 h-6 text-emerald-600" />
            <span className="text-gray-900">
              Utforska <span className="text-emerald-600">Sverige</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Hem
            </Link>
            <Link
              href="/utforska"
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Utforska
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Meny"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden pb-4 border-t border-gray-100 pt-4 flex flex-col gap-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Hem
            </Link>
            <Link
              href="/utforska"
              className="text-gray-600 hover:text-gray-900 font-medium"
              onClick={() => setMenuOpen(false)}
            >
              Utforska
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
