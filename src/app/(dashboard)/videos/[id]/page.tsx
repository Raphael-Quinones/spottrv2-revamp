import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download,
  Search,
  Clock,
  FileVideo
} from 'lucide-react';

export default function VideoDetailPage({ params }: { params: { id: string } }) {
  // Mock video data - no actual video playback
  const video = {
    id: params.id,
    name: 'traffic_cam_001.mp4',
    status: 'completed',
    duration: '2:34',
    size: '125 MB',
    uploadDate: '2024-01-15',
    processDate: '2024-01-15',
    prompt: 'Find all license plates in the video',
    accuracy: 'GPT-5 Mini',
    frameInterval: 0.5,
    totalFrames: 308,
    tokensUsed: 125000,
  };

  const matches = [
    { timestamp: '00:15', confidence: 95, content: 'License plate: ABC-123' },
    { timestamp: '00:45', confidence: 92, content: 'License plate: XYZ-789' },
    { timestamp: '01:23', confidence: 88, content: 'License plate: DEF-456' },
    { timestamp: '02:10', confidence: 90, content: 'License plate: GHI-012' },
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold uppercase mb-2">{video.name}</h1>
            <p className="font-mono text-sm text-muted-fg">
              Uploaded on {video.uploadDate}
            </p>
          </div>
          <Badge variant="success" className="text-lg px-4 py-2">
            Completed
          </Badge>
        </div>
      </div>

      {/* Video Player Mockup */}
      <Card className="mb-8">
        <CardContent className="p-0">
          <div className="relative bg-fg aspect-video flex items-center justify-center">
            <FileVideo className="w-24 h-24 text-bg opacity-50" />
            <div className="absolute bottom-0 left-0 right-0 bg-bg/90 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Play className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Pause className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
                <span className="font-mono text-xs">00:00 / {video.duration}</span>
              </div>
              <div className="h-2 bg-muted border border-border">
                <div className="h-full bg-fg" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Video Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-fg">Search Prompt:</span>
                <span>"{video.prompt}"</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-fg">AI Model:</span>
                <span>{video.accuracy}</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-fg">Frame Interval:</span>
                <span>{video.frameInterval}s</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-fg">Total Frames:</span>
                <span>{video.totalFrames}</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-fg">Tokens Used:</span>
                <span>{video.tokensUsed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-mono text-sm">
                <span className="text-muted-fg">Process Date:</span>
                <span>{video.processDate}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Matches Found ({matches.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {matches.map((match, index) => (
                <div key={index} className="border-2 border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono text-sm">{match.timestamp}</span>
                    </div>
                    <Badge variant={match.confidence > 90 ? 'success' : 'warning'}>
                      {match.confidence}% confidence
                    </Badge>
                  </div>
                  <p className="font-mono text-sm">{match.content}</p>
                  <Button size="sm" variant="outline" className="mt-2">
                    Jump to Timestamp
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="default">
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
              <Button className="w-full" variant="secondary">
                <Search className="w-4 h-4 mr-2" />
                New Search
              </Button>
              <Button className="w-full" variant="outline">
                Reprocess Video
              </Button>
              <Button className="w-full" variant="outline">
                Delete Video
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="font-mono text-xs">
                <span className="text-muted-fg">Size:</span> {video.size}
              </div>
              <div className="font-mono text-xs">
                <span className="text-muted-fg">Duration:</span> {video.duration}
              </div>
              <div className="font-mono text-xs">
                <span className="text-muted-fg">Format:</span> MP4
              </div>
              <div className="font-mono text-xs">
                <span className="text-muted-fg">Resolution:</span> 1920x1080
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}