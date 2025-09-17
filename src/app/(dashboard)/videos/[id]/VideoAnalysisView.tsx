'use client';

import { useState, useRef } from 'react';
import VideoPlayerEnhanced from '@/components/video-player-enhanced';
import VideoSearch from '@/components/video-search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoAnalysisViewProps {
  video: {
    id: string;
    url: string;
    filename: string;
    video_analysis: any[];
  };
}

export default function VideoAnalysisView({ video }: VideoAnalysisViewProps) {
  const [searchRanges, setSearchRanges] = useState<any[]>([]);
  const [jumpToTimestamp, setJumpToTimestamp] = useState<number | null>(null);

  // Convert file:// URL to streaming endpoint
  const getVideoUrl = () => {
    if (video.url.startsWith('file://')) {
      return `/api/video/${video.id}/stream`;
    }
    return video.url;
  };

  const handleResultClick = (timestamp: number) => {
    console.log(`\n🎥 ANALYSIS VIEW: Handling result click for timestamp ${timestamp}s`);

    // Scroll to video player
    const videoElement = document.getElementById('video-player-section');
    if (videoElement) {
      console.log('  Scrolling to video player...');
      videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Trigger the video player to jump to this timestamp
    console.log('  Triggering jump to timestamp in video player...');
    setJumpToTimestamp(timestamp);
  };

  const handleRangesUpdate = (ranges: any[]) => {
    console.log(`\n🎥 ANALYSIS VIEW: Updating search ranges`);
    console.log(`  Received ${ranges.length} ranges`);
    setSearchRanges(ranges);
  };

  return (
    <div className="space-y-8">
      {/* Video Player with Timeline Highlights */}
      <div id="video-player-section">
        <Card className="border-4 border-border">
          <CardHeader>
            <CardTitle className="uppercase">Video with Search Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoPlayerEnhanced
              videoUrl={getVideoUrl()}
              searchRanges={searchRanges}
              jumpToTimestamp={jumpToTimestamp}
              onJumpComplete={() => setJumpToTimestamp(null)}
              className="aspect-video"
            />
            {searchRanges.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-100 border-2 border-yellow-600 font-mono text-sm">
                <strong>💡 Tip:</strong> Yellow highlights on the timeline show search matches. Click them to jump to that moment!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Search Component */}
      <VideoSearch
        videoId={video.id}
        onResultClick={handleResultClick}
        onRangesUpdate={handleRangesUpdate}
      />

      {/* Analysis Summary */}
      {video.video_analysis && video.video_analysis.length > 0 && (
        <Card className="border-4 border-border">
          <CardHeader>
            <CardTitle className="uppercase">Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-fg">Total Frames Analyzed:</span>
                <span>{video.video_analysis.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-fg">Analysis Available:</span>
                <span className="text-green-600">✓ Ready for Search</span>
              </div>
            </div>

            {/* Quick Stats from Analysis */}
            <div className="mt-4 pt-4 border-t-2 border-border">
              <p className="font-mono text-xs text-muted-fg mb-2">
                Use AI search above to find specific moments like:
              </p>
              <ul className="font-mono text-xs text-muted-fg space-y-1">
                <li>• "red cars on the right lane"</li>
                <li>• "people crossing the street"</li>
                <li>• "traffic lights turning green"</li>
                <li>• "vehicles making left turns"</li>
                <li>• "stop signs or speed limit signs"</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}