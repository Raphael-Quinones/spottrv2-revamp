import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileVideo, Clock, Search } from 'lucide-react';
import Link from 'next/link';

export default function VideosPage() {
  // Mock data - no database connection
  const videos = [
    {
      id: 1,
      name: 'traffic_cam_001.mp4',
      status: 'completed',
      duration: '2:34',
      size: '125 MB',
      date: '2024-01-15',
      analysisScope: 'Analyze everything',
      matches: 12,
    },
    {
      id: 2,
      name: 'security_footage.mp4',
      status: 'processing',
      progress: 65,
      duration: '5:12',
      size: '250 MB',
      date: '2024-01-14',
      analysisScope: 'Focus on people and entrances',
    },
    {
      id: 3,
      name: 'dashcam_highway.mp4',
      status: 'completed',
      duration: '3:45',
      size: '180 MB',
      date: '2024-01-13',
      analysisScope: 'Track all road signs and text',
      matches: 23,
    },
    {
      id: 4,
      name: 'store_surveillance.mp4',
      status: 'failed',
      duration: '1:20',
      size: '65 MB',
      date: '2024-01-12',
      analysisScope: 'Focus on people movements',
    },
    {
      id: 5,
      name: 'parking_lot.mp4',
      status: 'completed',
      duration: '10:00',
      size: '450 MB',
      date: '2024-01-11',
      analysisScope: 'Analyze all vehicles',
      matches: 8,
    },
    {
      id: 6,
      name: 'drone_footage.mp4',
      status: 'queued',
      duration: '7:30',
      size: '320 MB',
      date: '2024-01-10',
      analysisScope: 'Focus on buildings and structures',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Videos</h1>
        <p className="font-mono text-sm text-muted-fg">
          Manage and review your processed videos
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-fg" />
          <Input 
            placeholder="Search videos..." 
            className="pl-10"
          />
        </div>
        <Button variant="secondary">Filter</Button>
      </div>

      {/* Videos Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="brutal-shadow-hover">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <FileVideo className="w-8 h-8" />
                {video.status === 'completed' && (
                  <Badge variant="success">Completed</Badge>
                )}
                {video.status === 'processing' && (
                  <Badge variant="warning">Processing</Badge>
                )}
                {video.status === 'failed' && (
                  <Badge variant="destructive">Failed</Badge>
                )}
                {video.status === 'queued' && (
                  <Badge variant="secondary">Queued</Badge>
                )}
              </div>
              
              <h3 className="font-bold uppercase text-sm mb-2 truncate">
                {video.name}
              </h3>
              
              <p className="font-mono text-xs text-muted-fg mb-4 line-clamp-2">
                Analysis: {video.analysisScope}
              </p>
              
              <div className="space-y-1 mb-4">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-fg">Duration:</span>
                  <span>{video.duration}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-fg">Size:</span>
                  <span>{video.size}</span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-fg">Date:</span>
                  <span>{video.date}</span>
                </div>
                {video.matches !== undefined && (
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-muted-fg">Matches:</span>
                    <span className="font-bold">{video.matches}</span>
                  </div>
                )}
              </div>
              
              {video.status === 'processing' && video.progress && (
                <div className="mb-4">
                  <div className="h-2 bg-muted border border-border">
                    <div 
                      className="h-full bg-fg transition-all" 
                      style={{ width: `${video.progress}%` }}
                    />
                  </div>
                  <p className="font-mono text-xs mt-1">{video.progress}% Complete</p>
                </div>
              )}
              
              <Link href={`/videos/${video.id}`}>
                <Button 
                  variant={video.status === 'completed' ? 'default' : 'outline'} 
                  className="w-full"
                  disabled={video.status !== 'completed'}
                >
                  {video.status === 'completed' ? 'View Results' : 'View Details'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}