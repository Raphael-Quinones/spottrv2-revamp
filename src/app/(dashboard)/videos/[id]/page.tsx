'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  Maximize,
  Search,
  Download,
  ChevronLeft,
  Clock,
  FileText,
  Zap
} from 'lucide-react';

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const video = {
    id: params.id,
    name: 'traffic_cam_001.mp4',
    status: 'completed',
    accuracyLevel: 'nano',
    duration: '2:34',
    durationSeconds: 154,
    fileSize: '45.2 MB',
    processedAt: '2024-01-15 14:30',
    searchPrompt: 'Find all license plates',
    frameInterval: 0.5,
    tokensUsed: 12500,
    url: '/api/placeholder/video',
  };

  const analysisHighlights = [
    { timestamp: 12, duration: 5, label: 'License plate: ABC-123', confidence: 0.95 },
    { timestamp: 45, duration: 3, label: 'License plate: XYZ-789', confidence: 0.88 },
    { timestamp: 78, duration: 4, label: 'License plate: DEF-456', confidence: 0.92 },
    { timestamp: 120, duration: 6, label: 'Multiple plates detected', confidence: 0.76 },
  ];

  const searchResults = [
    { timestamp: 12, text: 'White sedan with license plate ABC-123 entering frame' },
    { timestamp: 45, text: 'Blue truck with license plate XYZ-789 passing by' },
    { timestamp: 78, text: 'Red car with license plate DEF-456 stopped at light' },
    { timestamp: 120, text: 'Multiple vehicles visible, 3 license plates detected' },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (timestamp: number) => {
    setCurrentTime(timestamp);
    // In real implementation, would seek video to this timestamp
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/videos">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Videos
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold uppercase mb-2">{video.name}</h1>
            <p className="font-mono text-sm text-gray-600">
              Processed on {video.processedAt}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="success">Completed</Badge>
            <Badge variant="outline">{video.accuracyLevel}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardContent className="p-0">
              {/* Video Player */}
              <div className="relative bg-black aspect-video">
                <video 
                  className="w-full h-full"
                  src={video.url}
                  poster="/api/placeholder/800/450"
                />
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-16 h-16 border-4"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </Button>
                </div>
              </div>

              {/* Timeline with Highlights */}
              <div className="p-4 border-t-2 border-black">
                <div className="relative h-2 bg-gray-200 border border-black mb-2">
                  {/* Progress */}
                  <div 
                    className="absolute h-full bg-black" 
                    style={{ width: `${(currentTime / video.durationSeconds) * 100}%` }}
                  />
                  
                  {/* Highlights */}
                  {analysisHighlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="absolute h-full bg-yellow-400 cursor-pointer hover:bg-yellow-500"
                      style={{
                        left: `${(highlight.timestamp / video.durationSeconds) * 100}%`,
                        width: `${(highlight.duration / video.durationSeconds) * 100}%`,
                      }}
                      onClick={() => handleSeek(highlight.timestamp)}
                      title={highlight.label}
                    />
                  ))}
                </div>
                
                <div className="flex justify-between font-mono text-xs">
                  <span>{formatTime(currentTime)}</span>
                  <span>{video.duration}</span>
                </div>
              </div>

              {/* Player Controls */}
              <div className="p-4 border-t-2 border-black flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button size="icon" variant="outline">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="default"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button size="icon" variant="outline">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button size="icon" variant="ghost">
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search in Video */}
          <Card>
            <CardHeader>
              <CardTitle>Search in Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Search for specific moments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button>
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left p-3 border-2 border-black hover:bg-black hover:text-white transition-colors"
                    onClick={() => handleSeek(result.timestamp)}
                  >
                    <div className="flex items-start justify-between">
                      <p className="font-mono text-sm flex-1">{result.text}</p>
                      <Badge variant="outline" className="ml-2">
                        {formatTime(result.timestamp)}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Video Info */}
          <Card>
            <CardHeader>
              <CardTitle>Video Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-mono text-xs uppercase text-gray-600 mb-1">Original Prompt</p>
                <p className="text-sm">{video.searchPrompt}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-mono text-xs uppercase text-gray-600 mb-1">Duration</p>
                  <p className="font-bold">{video.duration}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-gray-600 mb-1">File Size</p>
                  <p className="font-bold">{video.fileSize}</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-gray-600 mb-1">Frame Interval</p>
                  <p className="font-bold">{video.frameInterval}s</p>
                </div>
                <div>
                  <p className="font-mono text-xs uppercase text-gray-600 mb-1">Tokens Used</p>
                  <p className="font-bold">{video.tokensUsed.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border-2 border-black">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-3" />
                    <span className="font-mono text-sm">Detections</span>
                  </div>
                  <span className="font-bold">{analysisHighlights.length}</span>
                </div>
                <div className="flex items-center justify-between p-3 border-2 border-black">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-3" />
                    <span className="font-mono text-sm">Process Time</span>
                  </div>
                  <span className="font-bold">2m 15s</span>
                </div>
                <div className="flex items-center justify-between p-3 border-2 border-black">
                  <div className="flex items-center">
                    <Zap className="w-5 h-5 mr-3" />
                    <span className="font-mono text-sm">Accuracy</span>
                  </div>
                  <Badge>{video.accuracyLevel}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Analysis
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button className="w-full" variant="outline">
                Re-process Video
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}