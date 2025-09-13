'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Upload, 
  Video, 
  Search, 
  Settings, 
  CreditCard,
  BarChart3,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/videos', label: 'Videos', icon: Video },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen border-r-4 border-black bg-white">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="font-bold uppercase text-sm mb-4">Navigation</h2>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 font-mono text-sm uppercase transition-colors",
                    isActive 
                      ? "bg-black text-white" 
                      : "hover:bg-black hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Processing Queue */}
        <div className="border-t-2 border-black pt-6">
          <h2 className="font-bold uppercase text-sm mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Processing Queue
          </h2>
          <div className="space-y-2">
            <div className="border-2 border-black p-3">
              <p className="font-mono text-xs uppercase">Video_001.mp4</p>
              <div className="mt-2 h-2 bg-gray-200 border border-black">
                <div className="h-full bg-black" style={{ width: '45%' }} />
              </div>
              <p className="font-mono text-xs mt-1">45% Complete</p>
            </div>
            <div className="border-2 border-black p-3">
              <p className="font-mono text-xs uppercase">Video_002.mp4</p>
              <p className="font-mono text-xs mt-1 text-gray-600">Queued</p>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="border-t-2 border-black pt-6 mt-6">
          <h2 className="font-bold uppercase text-sm mb-4 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Usage
          </h2>
          <div className="space-y-2">
            <div>
              <p className="font-mono text-xs uppercase">Minutes Used</p>
              <p className="font-bold text-lg">7.5 / 10</p>
              <div className="mt-1 h-2 bg-gray-200 border border-black">
                <div className="h-full bg-black" style={{ width: '75%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}