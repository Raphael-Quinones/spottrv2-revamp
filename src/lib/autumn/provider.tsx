'use client';

import { AutumnProvider as BaseAutumnProvider } from 'autumn-js/react';

export function AutumnProvider({ children }: { children: React.ReactNode }) {
  return (
    <BaseAutumnProvider backendUrl={process.env.NEXT_PUBLIC_AUTUMN_BACKEND_URL || 'http://localhost:3000'}>
      {children}
    </BaseAutumnProvider>
  );
}