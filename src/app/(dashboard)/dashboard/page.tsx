import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Clock, CheckCircle, Upload, Search, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats, getRecentVideos } from '../actions';
import { formatDuration, formatRelativeTime, formatMinutes } from '@/lib/utils';

export default async function DashboardPage() {
  // Fetch real data from database
  const [stats, recentVideos] = await Promise.all([
    getDashboardStats(),
    getRecentVideos(5),
  ]);

  const usagePercentage = stats.minutesLimit > 0
    ? (stats.minutesUsed / stats.minutesLimit) * 100
    : 0;

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
              <span className="text-2xl font-bold">{formatMinutes(stats.minutesUsed)}</span>
            </div>
            <p className="font-mono text-xs uppercase text-muted-fg">Minutes Used</p>
          </CardContent>
        </Card>

        <Card className="border-4">
          <CardContent className="p-6">
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-2xl font-bold">
                  {formatMinutes(stats.minutesUsed)}/{formatMinutes(stats.minutesLimit)}
                </span>
              </div>
              <div className="h-2 bg-muted border border-border">
                <div
                  className={`h-full transition-all ${
                    usagePercentage >= 100 ? 'bg-red-500' :
                    usagePercentage >= 80 ? 'bg-yellow-500' : 'bg-fg'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>
            <p className="font-mono text-xs uppercase text-muted-fg">
              {stats.subscriptionTier === 'enterprise' ? 'Unlimited' : 'Monthly Limit'}
            </p>
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
                {recentVideos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-fg">
                      <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="font-mono text-sm">No videos uploaded yet</p>
                    </td>
                  </tr>
                ) : (
                  recentVideos.map((video: any) => (
                    <tr key={video.id} className="border-b border-border">
                      <td className="p-4 font-mono text-sm">{video.filename}</td>
                      <td className="p-4">
                        {video.status === 'completed' && (
                          <Badge variant="success">Completed</Badge>
                        )}
                        {video.status === 'processing' && (
                          <div className="flex items-center space-x-2">
                            <Badge variant="warning">Processing</Badge>
                            {video.progress > 0 && (
                              <span className="text-xs text-muted-fg">{video.progress}%</span>
                            )}
                          </div>
                        )}
                        {video.status === 'pending' && (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                        {video.status === 'failed' && (
                          <div>
                            <Badge variant="destructive">Failed</Badge>
                            {video.error_message && (
                              <span title={video.error_message}>
                                <AlertCircle className="w-3 h-3 inline ml-1" />
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-mono text-sm">
                        {video.duration_seconds ? formatDuration(video.duration_seconds) : '-'}
                      </td>
                      <td className="p-4 font-mono text-sm text-muted-fg">
                        {formatRelativeTime(video.created_at)}
                      </td>
                      <td className="p-4">
                        <Link href={`/videos/${video.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}