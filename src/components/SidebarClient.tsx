'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useTransition } from 'react';
import {
  Home,
  Upload,
  Video,
  Search,
  CreditCard,
  Clock,
  BarChart3,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatMinutes, formatDuration } from '@/lib/utils';

const sidebarItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/videos', label: 'Videos', icon: Video },
  { href: '/billing', label: 'Billing', icon: CreditCard },
];

interface SidebarClientProps {
  processingVideos: any[];
  usage: {
    creditsUsed: number;
    creditsLimit: number;
    creditsBalance: number;
    percentageUsed: number;
    isExceeded: boolean;
    valueMetrics: {
      videoHours: number;
      searches: number;
    };
  };
}

export function SidebarClient({ processingVideos, usage }: SidebarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingPath, setLoadingPath] = React.useState<string | null>(null);

  const handleNavigation = (href: string) => {
    setLoadingPath(href);
    startTransition(() => {
      router.push(href);
      // Clear loading path after transition
      setTimeout(() => setLoadingPath(null), 100);
    });
  };

  return (
    <aside className="w-64 min-h-screen border-r-4 border-border bg-bg">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="font-bold uppercase text-sm mb-4">Navigation</h2>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isLoading = loadingPath === item.href;

              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigation(item.href)}
                  disabled={isLoading || isPending}
                  className={`w-full flex items-center space-x-3 px-4 py-3 font-mono text-sm uppercase transition-all ${
                    isActive
                      ? 'bg-fg text-bg'
                      : 'hover:bg-fg hover:text-bg'
                  } ${isLoading ? 'opacity-70' : ''}`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                  <span className="text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Processing Queue - Real Data */}
        {processingVideos.length > 0 && (
          <div className="border-t-2 border-border pt-6">
            <h2 className="font-bold uppercase text-sm mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Processing Queue
            </h2>
            <div className="space-y-2">
              {processingVideos.map((video) => (
                <div key={video.id} className="border-2 border-border p-3">
                  <p className="font-mono text-xs uppercase truncate" title={video.filename}>
                    {video.filename}
                  </p>
                  {video.status === 'processing' ? (
                    <>
                      <div className="mt-2 h-2 bg-muted border border-border">
                        <div
                          className="h-full bg-fg transition-all"
                          style={{ width: `${video.progress || 0}%` }}
                        />
                      </div>
                      <p className="font-mono text-xs mt-1">{video.progress || 0}% Complete</p>
                    </>
                  ) : video.status === 'pending' ? (
                    <p className="font-mono text-xs mt-1 text-muted-fg">Queued</p>
                  ) : video.status === 'failed' ? (
                    <p className="font-mono text-xs mt-1 text-red-500">Failed</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Stats - Real Data */}
        <div className="border-t-2 border-border pt-6 mt-6">
          <h2 className="font-bold uppercase text-sm mb-4 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Usage
          </h2>
          <div className="space-y-2">
            <div>
              <p className="font-mono text-xs uppercase">Credits Used</p>
              <p className="font-bold text-lg">
                {usage.creditsUsed.toLocaleString()} / {usage.creditsLimit.toLocaleString()}
              </p>
              <p className="font-mono text-xs mt-1 text-muted-fg">
                {usage.creditsBalance.toLocaleString()} credits remaining
              </p>
              <div className="mt-2 h-2 bg-muted border border-border">
                <div
                  className={`h-full transition-all ${
                    usage.isExceeded ? 'bg-red-500' :
                    usage.percentageUsed >= 80 ? 'bg-yellow-500' :
                    'bg-fg'
                  }`}
                  style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
                />
              </div>
              {usage.isExceeded && (
                <div className="flex items-center mt-2">
                  <AlertCircle className="w-3 h-3 mr-1 text-red-500" />
                  <p className="font-mono text-xs text-red-500">Limit Exceeded</p>
                </div>
              )}
              {!usage.isExceeded && usage.percentageUsed >= 80 && (
                <div className="flex items-center mt-2">
                  <AlertCircle className="w-3 h-3 mr-1 text-yellow-500" />
                  <p className="font-mono text-xs text-yellow-500">
                    {Math.round(100 - usage.percentageUsed)}% Remaining
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}