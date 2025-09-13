'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Video, 
  Grid, 
  List, 
  Search, 
  Filter,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';

export default function VideosPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const videos = [
    {
      id: 1,
      name: 'traffic_cam_001.mp4',
      thumbnail: '/api/placeholder/320/180',
      status: 'completed',
      accuracyLevel: 'nano',
      duration: '2:34',
      fileSize: '45.2 MB',
      processedAt: '2024-01-15 14:30',
      searchPrompt: 'Find all license plates',
      progress: 100,
    },
    {
      id: 2,
      name: 'security_footage.mp4',
      thumbnail: '/api/placeholder/320/180',
      status: 'processing',
      accuracyLevel: 'mini',
      duration: '5:12',
      fileSize: '120.5 MB',
      processedAt: null,
      searchPrompt: 'Identify people wearing red shirts',
      progress: 65,
    },
    {
      id: 3,
      name: 'dashcam_highway.mp4',
      thumbnail: '/api/placeholder/320/180',
      status: 'completed',
      accuracyLevel: 'full',
      duration: '3:45',
      fileSize: '89.3 MB',
      processedAt: '2024-01-14 09:15',
      searchPrompt: 'Detect accidents or near-misses',
      progress: 100,
    },
    {
      id: 4,
      name: 'store_surveillance.mp4',
      thumbnail: '/api/placeholder/320/180',
      status: 'failed',
      accuracyLevel: 'nano',
      duration: '1:20',
      fileSize: '25.7 MB',
      processedAt: null,
      searchPrompt: 'Track customer movements',
      progress: 0,
    },
    {
      id: 5,
      name: 'parking_lot.mp4',
      thumbnail: '/api/placeholder/320/180',
      status: 'pending',
      accuracyLevel: 'mini',
      duration: '10:05',
      fileSize: '250.0 MB',
      processedAt: null,
      searchPrompt: 'Find specific vehicle models',
      progress: 0,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'processing':
        return <Badge variant="warning">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return null;
    }
  };

  const filteredVideos = videos.filter(video =>
    video.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.searchPrompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (videos.length === 0) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold uppercase mb-2">Videos</h1>
          <p className="font-mono text-sm text-gray-600">
            All your uploaded and processed videos
          </p>
        </div>
        <Card className="border-2 border-black">
          <CardContent className="py-16">
            <EmptyState
              icon={Video}
              title="No Videos Yet"
              description="Upload your first video to start analyzing"
              action={{
                label: 'Upload Video',
                onClick: () => window.location.href = '/upload'
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Videos</h1>
        <p className="font-mono text-sm text-gray-600">
          All your uploaded and processed videos
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
            <Input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="w-5 h-5" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden hover:shadow-brutal transition-all">
              <div className="relative bg-gray-100 h-48 border-b-2 border-black">
                {video.status === 'processing' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Clock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                      <p className="font-mono text-sm">{video.progress}%</p>
                    </div>
                  </div>
                )}
                {video.status === 'completed' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white bg-black p-2" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-sm uppercase truncate flex-1">
                    {video.name}
                  </h3>
                  {getStatusIcon(video.status)}
                </div>
                <p className="font-mono text-xs text-gray-600 mb-3 line-clamp-2">
                  {video.searchPrompt}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs">{video.duration}</span>
                  <Badge variant="outline" className="text-xs">
                    {video.accuracyLevel}
                  </Badge>
                </div>
                {video.status === 'processing' && (
                  <div className="mb-3">
                    <div className="h-2 bg-gray-200 border border-black">
                      <div 
                        className="h-full bg-black transition-all" 
                        style={{ width: `${video.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                <Link href={`/videos/${video.id}`}>
                  <Button 
                    className="w-full" 
                    variant={video.status === 'completed' ? 'default' : 'outline'}
                    disabled={video.status === 'pending'}
                  >
                    {video.status === 'completed' ? 'View' : 
                     video.status === 'processing' ? 'Processing...' :
                     video.status === 'failed' ? 'Retry' : 'Queued'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left p-4 font-bold uppercase text-sm">Name</th>
                    <th className="text-left p-4 font-bold uppercase text-sm">Status</th>
                    <th className="text-left p-4 font-bold uppercase text-sm">Accuracy</th>
                    <th className="text-left p-4 font-bold uppercase text-sm">Duration</th>
                    <th className="text-left p-4 font-bold uppercase text-sm">Size</th>
                    <th className="text-left p-4 font-bold uppercase text-sm">Date</th>
                    <th className="text-left p-4 font-bold uppercase text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((video) => (
                    <tr key={video.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-mono text-sm">{video.name}</p>
                          <p className="font-mono text-xs text-gray-600 mt-1">
                            {video.searchPrompt}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(video.status)}</td>
                      <td className="p-4">
                        <Badge variant="outline">{video.accuracyLevel}</Badge>
                      </td>
                      <td className="p-4 font-mono text-sm">{video.duration}</td>
                      <td className="p-4 font-mono text-sm">{video.fileSize}</td>
                      <td className="p-4 font-mono text-sm">
                        {video.processedAt || '—'}
                      </td>
                      <td className="p-4">
                        <Link href={`/videos/${video.id}`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={video.status === 'pending'}
                          >
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}