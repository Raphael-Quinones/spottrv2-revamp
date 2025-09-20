'use client';

import Link from 'next/link';
import { Bell, Menu, User, LogOut, ChevronDown, Crown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from './theme-toggle';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  subscriptionTier?: string;
}

export function Navbar({ subscriptionTier = 'free' }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="border-b-4 border-border bg-bg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-fg" />
              <span className="text-2xl font-bold uppercase tracking-tighter">
                Spottr
              </span>
            </Link>
            {subscriptionTier === 'pro' && (
              <Badge
                className="hidden md:flex items-center text-white font-bold"
                style={{
                  background: 'linear-gradient(90deg, #ff0000 0%, #ff7f00 14%, #ffff00 28%, #00ff00 42%, #0000ff 56%, #4b0082 70%, #9400d3 84%, #ff0000 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'rainbow-shift 4s linear infinite',
                  textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 1px 0 #000, 1px 0 0 #000, 0 -1px 0 #000, -1px 0 0 #000'
                }}
              >
                <Crown className="w-3 h-3 mr-1" style={{ filter: 'drop-shadow(1px 1px 0 #000) drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000)' }} />
                PRO
              </Badge>
            )}
            {subscriptionTier === 'enterprise' && (
              <Badge className="bg-purple-600 text-white hidden md:flex items-center">
                <Crown className="w-3 h-3 mr-1" style={{ filter: 'drop-shadow(1px 1px 0 #000) drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000)' }} />
                ENTERPRISE
              </Badge>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/dashboard" 
              className="font-mono text-sm uppercase text-fg hover:bg-fg hover:text-bg px-3 py-1 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/upload" 
              className="font-mono text-sm uppercase text-fg hover:bg-fg hover:text-bg px-3 py-1 transition-colors"
            >
              Upload
            </Link>
            <Link 
              href="/videos" 
              className="font-mono text-sm uppercase text-fg hover:bg-fg hover:text-bg px-3 py-1 transition-colors"
            >
              Videos
            </Link>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button className="p-2 hover:bg-fg hover:text-bg transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                className="p-2 hover:bg-fg hover:text-bg transition-colors flex items-center space-x-1"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                disabled={loading}
              >
                <User className="w-5 h-5" />
                {!loading && (
                  <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {userMenuOpen && !loading && (
                <div className="absolute right-0 mt-2 w-56 bg-bg border-4 border-border shadow-brutal z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b-2 border-border">
                        <p className="text-sm font-mono text-muted-fg">Signed in as</p>
                        <p className="text-sm font-bold truncate">{user.email}</p>
                        {subscriptionTier === 'pro' && (
                          <div className="mt-2">
                            <Badge
                              className="text-xs text-white font-bold"
                              style={{
                                background: 'linear-gradient(90deg, #ff0000 0%, #ff7f00 14%, #ffff00 28%, #00ff00 42%, #0000ff 56%, #4b0082 70%, #9400d3 84%, #ff0000 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'rainbow-shift 4s linear infinite',
                                textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 1px 0 #000, 1px 0 0 #000, 0 -1px 0 #000, -1px 0 0 #000'
                              }}
                            >
                              <Crown className="w-3 h-3 mr-1" style={{ filter: 'drop-shadow(1px 1px 0 #000) drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000)' }} />
                              PRO MEMBER
                            </Badge>
                          </div>
                        )}
                        {subscriptionTier === 'enterprise' && (
                          <div className="mt-2">
                            <Badge className="bg-purple-600 text-white text-xs">
                              <Crown className="w-3 h-3 mr-1" style={{ filter: 'drop-shadow(1px 1px 0 #000) drop-shadow(-1px -1px 0 #000) drop-shadow(1px -1px 0 #000) drop-shadow(-1px 1px 0 #000)' }} />
                              ENTERPRISE
                            </Badge>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-mono hover:bg-fg hover:text-bg transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm font-mono hover:bg-fg hover:text-bg transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-4 py-2 text-sm font-mono hover:bg-fg hover:text-bg transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              className="md:hidden p-2 hover:bg-fg hover:text-bg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-border">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Link 
              href="/dashboard" 
              className="block font-mono text-sm uppercase text-fg hover:bg-fg hover:text-bg px-3 py-2 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              href="/upload" 
              className="block font-mono text-sm uppercase text-fg hover:bg-fg hover:text-bg px-3 py-2 transition-colors"
            >
              Upload
            </Link>
            <Link 
              href="/videos" 
              className="block font-mono text-sm uppercase text-fg hover:bg-fg hover:text-bg px-3 py-2 transition-colors"
            >
              Videos
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}