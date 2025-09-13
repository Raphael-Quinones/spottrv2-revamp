'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Search,
  Clock,
  FileVideo,
  Download
} from 'lucide-react';

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Mock video data
  const video = {
    id: params.id,
    name: 'traffic_cam_001.mp4',
    duration: '2:34',
    uploadDate: '2024-01-15',
    processDate: '2024-01-15',
    analysisScope: 'Analyze everything in the video',
  };

  // Comprehensive mock analysis data - everything AI found
  const allAnalysisData = [
    { timestamp: '0:15', content: 'License plate ABC-123' },
    { timestamp: '0:15', content: 'Red sedan' },
    { timestamp: '0:18', content: 'Person crossing street' },
    { timestamp: '0:22', content: 'Blue SUV' },
    { timestamp: '0:30', content: 'Street sign "Main St"' },
    { timestamp: '0:35', content: 'Person wearing yellow jacket' },
    { timestamp: '0:45', content: 'License plate XYZ-789' },
    { timestamp: '0:45', content: 'White delivery truck' },
    { timestamp: '0:52', content: 'STOP sign' },
    { timestamp: '1:05', content: 'Group of people' },
    { timestamp: '1:10', content: 'Green motorcycle' },
    { timestamp: '1:15', content: 'Traffic light red' },
    { timestamp: '1:23', content: 'License plate DEF-456' },
    { timestamp: '1:30', content: 'Person with dog' },
    { timestamp: '1:35', content: 'Yellow taxi' },
    { timestamp: '1:45', content: 'Coffee Shop sign' },
    { timestamp: '1:50', content: 'Fire hydrant' },
    { timestamp: '2:00', content: 'Cyclist' },
    { timestamp: '2:10', content: 'License plate GHI-012' },
    { timestamp: '2:15', content: 'Black sedan' },
  ];

  // Filter data based on search
  const searchResults = searchQuery.trim() 
    ? allAnalysisData.filter(item => 
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Convert timestamp to percentage for progress bar
  const timestampToPercent = (timestamp: string) => {
    const [min, sec] = timestamp.split(':').map(Number);
    const totalSeconds = min * 60 + sec;
    const videoDuration = 154; // 2:34 in seconds
    return (totalSeconds / videoDuration) * 100;
  };

  // Get unique timestamps for progress bar highlights
  const highlightPositions = searchResults.map(item => timestampToPercent(item.timestamp));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">{video.name}</h1>
        <p className="font-mono text-sm text-muted-fg">
          Processed on {video.processDate}
        </p>
      </div>

      {/* Video Player */}
      <Card className="mb-8">
        <CardContent className="p-0">
          <div className="relative bg-fg aspect-video flex items-center justify-center">
            <FileVideo className="w-24 h-24 text-bg opacity-50" />
            
            {/* Player Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-bg/90 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
                <span className="font-mono text-xs">0:00 / {video.duration}</span>
              </div>
              
              {/* Progress Bar with Highlights */}
              <div className="relative">
                <div className="h-2 bg-muted border border-border">
                  <div className="h-full bg-fg" style={{ width: '0%' }} />
                </div>
                
                {/* Search Result Highlights on Timeline */}
                {searchQuery && searchResults.length > 0 && highlightPositions.map((position, index) => (
                  <div
                    key={index}
                    className="absolute top-0 w-1 h-full bg-yellow-500"
                    style={{ left: `${position}%` }}
                    title={searchResults[index].content}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Search Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Search Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-fg" />
                <Input
                  placeholder="Search for anything..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Search Results - Simple Timestamp List */}
              {searchQuery && (
                <div className="space-y-2">
                  {searchResults.length > 0 ? (
                    <>
                      <p className="font-mono text-xs text-muted-fg mb-3">
                        Found {searchResults.length} results
                      </p>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {searchResults.map((result, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-3 border-2 border-border hover:bg-muted transition-colors"
                          >
                            <span className="font-mono text-sm">{result.content}</span>
                            <div className="flex items-center gap-2 text-muted-fg">
                              <Clock className="w-3 h-3" />
                              <span className="font-mono text-xs">{result.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-center py-8 text-muted-fg font-mono text-sm">
                      No results for "{searchQuery}"
                    </p>
                  )}
                </div>
              )}

              {!searchQuery && (
                <p className="text-center py-8 text-muted-fg font-mono text-sm">
                  Type to search through the video analysis
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Video Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-fg">Duration:</span>
                <span>{video.duration}</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-fg">Upload Date:</span>
                <span>{video.uploadDate}</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-fg">Process Date:</span>
                <span>{video.processDate}</span>
              </div>
              <div className="font-mono text-sm">
                <span className="text-muted-fg">Analysis Scope:</span>
                <p className="mt-1">{video.analysisScope}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="default">
                <Download className="w-4 h-4 mr-2" />
                Export Analysis
              </Button>
              <Button className="w-full" variant="outline">
                Delete Video
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}