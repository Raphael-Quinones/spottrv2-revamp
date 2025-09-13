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
  Clock,
  BarChart3
} from 'lucide-react';

const sidebarItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/videos', label: 'Videos', icon: Video },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen border-r-4 border-border bg-bg">
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
                  className={`flex items-center space-x-3 px-4 py-3 font-mono text-sm uppercase transition-colors ${
                    isActive 
                      ? 'bg-fg text-bg' 
                      : 'hover:bg-fg hover:text-bg'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Processing Queue - Mock Data */}
        <div className="border-t-2 border-border pt-6">
          <h2 className="font-bold uppercase text-sm mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Processing Queue
          </h2>
          <div className="space-y-2">
            <div className="border-2 border-border p-3">
              <p className="font-mono text-xs uppercase">Video_001.mp4</p>
              <div className="mt-2 h-2 bg-muted border border-border">
                <div className="h-full bg-fg" style={{ width: '45%' }} />
              </div>
              <p className="font-mono text-xs mt-1">45% Complete</p>
            </div>
            <div className="border-2 border-border p-3">
              <p className="font-mono text-xs uppercase">Video_002.mp4</p>
              <p className="font-mono text-xs mt-1 text-muted-fg">Queued</p>
            </div>
          </div>
        </div>

        {/* Usage Stats - Mock Data */}
        <div className="border-t-2 border-border pt-6 mt-6">
          <h2 className="font-bold uppercase text-sm mb-4 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Usage
          </h2>
          <div className="space-y-2">
            <div>
              <p className="font-mono text-xs uppercase">Minutes Used</p>
              <p className="font-bold text-lg">7.5 / 10</p>
              <div className="mt-1 h-2 bg-muted border border-border">
                <div className="h-full bg-fg" style={{ width: '75%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}