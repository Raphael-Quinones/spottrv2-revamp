'use client';

import Link from 'next/link';
import { Bell, Menu, User } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b-4 border-black bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black" />
            <span className="text-2xl font-bold uppercase tracking-tighter">
              Spottr
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/dashboard" 
              className="font-mono text-sm uppercase hover:bg-black hover:text-white px-3 py-1 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/upload" 
              className="font-mono text-sm uppercase hover:bg-black hover:text-white px-3 py-1 transition-colors"
            >
              Upload
            </Link>
            <Link 
              href="/videos" 
              className="font-mono text-sm uppercase hover:bg-black hover:text-white px-3 py-1 transition-colors"
            >
              Videos
            </Link>
            <Link 
              href="/search" 
              className="font-mono text-sm uppercase hover:bg-black hover:text-white px-3 py-1 transition-colors"
            >
              Search
            </Link>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-black hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-black hover:text-white transition-colors">
              <User className="w-5 h-5" />
            </button>
            <button 
              className="md:hidden p-2 hover:bg-black hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-black">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Link 
              href="/dashboard" 
              className="block font-mono text-sm uppercase hover:bg-black hover:text-white px-3 py-2 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/upload" 
              className="block font-mono text-sm uppercase hover:bg-black hover:text-white px-3 py-2 transition-colors"
            >
              Upload
            </Link>
            <Link 
              href="/videos" 
              className="block font-mono text-sm uppercase hover:bg-black hover:text-white px-3 py-2 transition-colors"
            >
              Videos
            </Link>
            <Link 
              href="/search" 
              className="block font-mono text-sm uppercase hover:bg-black hover:text-white px-3 py-2 transition-colors"
            >
              Search
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}