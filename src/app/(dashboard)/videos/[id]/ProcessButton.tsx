'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export default function ProcessButton({ videoId }: { videoId: string }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartProcessing = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId })
      });

      if (res.ok) {
        window.location.reload(); // Reload to show processing status
      } else {
        const error = await res.json();
        alert(`Failed to start processing: ${error.error}`);
        setIsProcessing(false);
      }
    } catch (error) {
      alert('Failed to start processing. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <Button
      className="brutal-shadow"
      onClick={handleStartProcessing}
      disabled={isProcessing}
    >
      <Play className="w-4 h-4 mr-2" />
      {isProcessing ? 'Starting...' : 'Start Processing'}
    </Button>
  );
}