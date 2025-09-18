'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity } from 'lucide-react';

interface ProcessingStatusProps {
  videoId: string;
  initialProgress: number;
  accuracyLevel: string;
}

export default function ProcessingStatus({
  videoId,
  initialProgress,
  accuracyLevel
}: ProcessingStatusProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}/status`);
        if (res.ok) {
          const data = await res.json();
          setProgress(data.progress);
          setStatus(data.status);

          // Stop polling if completed or failed
          if (data.status !== 'processing') {
            clearInterval(interval);
            // Reload page to show results if completed
            if (data.status === 'completed') {
              setTimeout(() => window.location.reload(), 1000);
            }
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [videoId]);

  return (
    <Card className="mb-8">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Activity className="w-8 h-8 text-yellow-500 animate-pulse" />
            <div>
              <h3 className="text-xl font-bold uppercase">Processing Video</h3>
              <p className="font-mono text-sm text-muted-fg mt-1">
                {progress}% complete
              </p>
            </div>
          </div>
          <Badge variant="warning">Processing</Badge>
        </div>

        <div>
          <Progress value={progress} className="h-4 border-2 border-border" />
          <p className="font-mono text-xs text-muted-fg mt-2">
            Analyzing frames every 10 seconds with GPT-5 Nano
          </p>
        </div>
      </CardContent>
    </Card>
  );
}