import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, CheckCircle, Upload, Search } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // Mock data - no database connection
  const stats = {
    totalVideos: 12,
    processedToday: 3,
    minutesUsed: 7.5,
    minutesTotal: 10,
  };

  const recentVideos = [
    { id: 1, name: 'traffic_cam_001.mp4', status: 'completed', duration: '2:34', date: '2 hours ago' },
    { id: 2, name: 'security_footage.mp4', status: 'processing', progress: 65, duration: '5:12', date: '4 hours ago' },
    { id: 3, name: 'dashcam_highway.mp4', status: 'completed', duration: '3:45', date: '1 day ago' },
    { id: 4, name: 'store_surveillance.mp4', status: 'failed', duration: '1:20', date: '2 days ago' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Dashboard</h1>
        <p className="font-mono text-sm text-muted-fg">
          Welcome back! Here's your video analysis overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Video className="w-8 h-8" />
              <span className="text-2xl font-bold">{stats.totalVideos}</span>
            </div>
            <p className="font-mono text-xs uppercase text-muted-fg">Total Videos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8" />
              <span className="text-2xl font-bold">{stats.processedToday}</span>
            </div>
            <p className="font-mono text-xs uppercase text-muted-fg">Processed Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8" />
              <span className="text-2xl font-bold">{stats.minutesUsed}</span>
            </div>
            <p className="font-mono text-xs uppercase text-muted-fg">Minutes Used</p>
          </CardContent>
        </Card>

        <Card className="border-4">
          <CardContent className="p-6">
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-2xl font-bold">{stats.minutesUsed}/{stats.minutesTotal}</span>
              </div>
              <div className="h-2 bg-muted border border-border">
                <div 
                  className="h-full bg-fg" 
                  style={{ width: `${(stats.minutesUsed / stats.minutesTotal) * 100}%` }}
                />
              </div>
            </div>
            <p className="font-mono text-xs uppercase text-muted-fg">Usage Limit</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="brutal-shadow">
          <CardContent className="p-8">
            <Upload className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold uppercase mb-2">Upload New Video</h3>
            <p className="font-mono text-sm text-muted-fg mb-4">
              Start analyzing a new video with AI
            </p>
            <Link href="/upload">
              <Button className="brutal-shadow">
                Upload Video
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="brutal-shadow">
          <CardContent className="p-8">
            <Search className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-bold uppercase mb-2">Search Videos</h3>
            <p className="font-mono text-sm text-muted-fg mb-4">
              Find specific moments in your processed videos
            </p>
            <Link href="/search">
              <Button variant="secondary" className="brutal-shadow">
                Start Searching
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Videos */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-4 font-bold uppercase text-sm">Name</th>
                  <th className="text-left p-4 font-bold uppercase text-sm">Status</th>
                  <th className="text-left p-4 font-bold uppercase text-sm">Duration</th>
                  <th className="text-left p-4 font-bold uppercase text-sm">Date</th>
                  <th className="text-left p-4 font-bold uppercase text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentVideos.map((video) => (
                  <tr key={video.id} className="border-b border-border">
                    <td className="p-4 font-mono text-sm">{video.name}</td>
                    <td className="p-4">
                      {video.status === 'completed' && (
                        <Badge variant="success">Completed</Badge>
                      )}
                      {video.status === 'processing' && (
                        <Badge variant="warning">Processing</Badge>
                      )}
                      {video.status === 'failed' && (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </td>
                    <td className="p-4 font-mono text-sm">{video.duration}</td>
                    <td className="p-4 font-mono text-sm text-muted-fg">{video.date}</td>
                    <td className="p-4">
                      <Link href={`/videos/${video.id}`}>
                        <Button size="sm" variant="outline">
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
    </div>
  );
}