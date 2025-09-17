'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => router.push('/videos')}
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Back to Videos
    </Button>
  );
}