import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Coins, CheckCircle, Upload, AlertCircle, PlayCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats, getRecentVideos, getDemoVideo } from '../actions';
import { formatDuration, formatRelativeTime } from '@/lib/utils';

export default async function DashboardPage() {
  // Fetch real data from database
  const [stats, recentVideos, demoVideo] = await Promise.all([
    getDashboardStats(),
    getRecentVideos(5),
    getDemoVideo(),
  ]);

  const usagePercentage = stats.creditsPurchased > 0
    ? (stats.creditsUsed / stats.creditsPurchased) * 100
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
              <Coins className="w-8 h-8" />
              <span className="text-2xl font-bold">{stats.creditsBalance.toLocaleString()}</span>
            </div>
            <p className="font-mono text-xs uppercase text-muted-fg">Credits Available</p>
          </CardContent>
        </Card>

        <Card className="border-4">
          <CardContent className="p-6">
            <div className="mb-2">
              <div className="flex flex-col mb-2">
                <span className="text-2xl font-bold">
                  {stats.creditsUsed.toLocaleString()} / {stats.creditsPurchased.toLocaleString()}
                </span>
                <span className="font-mono text-xs text-muted-fg mt-1">
                  {stats.formattedRemaining}
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
          </CardContent>
        </Card>
      </div>

      {/* Demo Video Showcase - Show prominently for new users */}
      {demoVideo && (
        <Card className="mb-8 border-4 border-green-500 brutal-shadow bg-green-50 dark:bg-green-950/10">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-500 text-white">
                  <PlayCircle className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold uppercase">Try Demo Video</h3>
                    <Badge variant="success" className="bg-green-500 text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      NO UPLOAD NEEDED
                    </Badge>
                  </div>
                  <p className="font-mono text-sm text-muted-fg mb-4">
                    Experience Spottr instantly with 87 minutes of pre-analyzed NYC dashcam footage
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="font-mono text-xs uppercase text-muted-fg">Duration</p>
                      <p className="font-bold text-lg">{formatDuration(demoVideo.duration_seconds)}</p>
                    </div>
                    <div>
                      <p className="font-mono text-xs uppercase text-muted-fg">Ready to Search</p>
                      <p className="font-bold text-lg">100%</p>
                    </div>
                  </div>
                  <div className="p-4 bg-bg border-2 border-border mb-6">
                    <p className="font-mono text-xs uppercase text-muted-fg mb-2">Try searching for:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 border border-border font-mono text-xs">Toyota</span>
                      <span className="px-2 py-1 border border-border font-mono text-xs">Yellow Taxi</span>
                      <span className="px-2 py-1 border border-border font-mono text-xs">Pedestrians</span>
                      <span className="px-2 py-1 border border-border font-mono text-xs">Traffic Lights</span>
                      <span className="px-2 py-1 border border-border font-mono text-xs">Street Signs</span>
                      <span className="px-2 py-1 border border-border font-mono text-xs">Buses</span>
                    </div>
                  </div>
                  <Link href={`/videos/${demoVideo.id}`}>
                    <Button size="lg" className="brutal-shadow bg-green-500 hover:bg-green-600 text-white">
                      <PlayCircle className="w-5 h-5 mr-2" />
                      EXPLORE DEMO VIDEO
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <Card className="brutal-shadow max-w-md">
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