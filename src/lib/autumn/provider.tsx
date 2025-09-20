'use client';

// Simple Autumn provider wrapper
// We use a custom implementation due to autumn-js incompatibility with Next.js 14
export function AutumnProvider({ children }: { children: React.ReactNode }) {
  // For now, just pass through children
  // If needed, we can add context for Autumn-related data here
  return <>{children}</>;
}