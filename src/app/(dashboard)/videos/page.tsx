import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileVideo, Clock, Search, AlertCircle, Upload } from 'lucide-react';
import Link from 'next/link';
import { getAllVideos } from '../actions';
import { formatDuration, formatFileSize, formatDate, formatRelativeTime } from '@/lib/utils';

export default async function VideosPage() {
  // Fetch real videos from database
  const videos = await getAllVideos();

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold uppercase mb-2">Videos</h1>
          <p className="font-mono text-sm text-muted-fg">
            Manage and search your analyzed videos
          </p>
        </div>
        <Link href="/upload">
          <Button className="brutal-shadow">
            <Upload className="w-4 h-4 mr-2" />
            Upload New
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-fg" />
          <Input
            type="text"
            placeholder="Search videos..."
            className="pl-12 py-6 text-lg border-4"
            disabled // Will implement search later
          />
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileVideo className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold uppercase mb-2">No Videos Yet</h3>
            <p className="font-mono text-sm text-muted-fg mb-4">
              Upload your first video to get started
            </p>
            <Link href="/upload">
              <Button className="brutal-shadow">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            </Link>
          </div>
        ) : (
          videos.map((video: any) => (
            <Card key={video.id} className={`brutal-shadow hover:shadow-brutal-lg transition-shadow ${video.is_demo ? 'border-yellow-500 border-2' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <FileVideo className="w-8 h-8" />
                  <div className="flex gap-2">
                    {video.is_demo && (
                      <Badge variant="warning" className="bg-yellow-500 text-black">DEMO</Badge>
                    )}
                    {video.status === 'completed' && (
                      <Badge variant="success">Completed</Badge>
                    )}
                    {video.status === 'processing' && (
                      <Badge variant="warning">
                        Processing {video.progress > 0 && `${video.progress}%`}
                      </Badge>
                    )}
                    {video.status === 'pending' && (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                    {video.status === 'failed' && (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-2 truncate" title={video.filename}>
                  {video.filename}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-muted-fg">Duration</span>
                    <span>{video.duration_seconds ? formatDuration(video.duration_seconds) : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-muted-fg">Size</span>
                    <span>{video.file_size ? formatFileSize(video.file_size) : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-sm">
                    <span className="text-muted-fg">Date</span>
                    <span>{formatDate(video.created_at)}</span>
                  </div>
                </div>

                {video.analysis_scope && (
                  <div className="mb-4">
                    <p className="font-mono text-xs text-muted-fg mb-1">Analysis Scope</p>
                    <p className="text-sm truncate" title={video.analysis_scope}>
                      {video.analysis_scope}
                    </p>
                  </div>
                )}

                {video.status === 'processing' && video.progress > 0 && (
                  <div className="mb-4">
                    <div className="h-2 bg-muted border border-border">
                      <div
                        className="h-full bg-fg transition-all"
                        style={{ width: `${video.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {video.status === 'failed' && video.error_message && (
                  <div className="mb-4 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-fg">{video.error_message}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-fg">
                    {formatRelativeTime(video.created_at)}
                  </span>
                  <Link href={`/videos/${video.id}`}>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}