import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileVideo,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  Download,
  Trash,
  Search,
  Play,
  Zap
} from 'lucide-react';
import { getVideoById, deleteVideo } from '../../actions';
import { formatDuration, formatFileSize, formatDate, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import ProcessButton from './ProcessButton';
import ProcessingStatus from './ProcessingStatus';
import BackButton from './BackButton';
import DeleteButton from './DeleteButton';
import VideoAnalysisView from './VideoAnalysisView';

export default async function VideoDetailPage({
  params
}: {
  params: { id: string }
}) {
  const video = await getVideoById(params.id);

  if (!video) {
    notFound();
  }

  const isProcessing = video.status === 'processing';
  const isCompleted = video.status === 'completed';
  const isFailed = video.status === 'failed';
  const isPending = video.status === 'pending';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold uppercase mb-2">{video.filename}</h1>
          <p className="font-mono text-sm text-muted-fg">
            Uploaded {formatRelativeTime(video.created_at)}
          </p>
        </div>
        <div className="flex gap-3">
          <BackButton />
        </div>
      </div>

      {/* Manual Processing Trigger for Pending Videos */}
      {isPending && (
        <Card className="mb-8 border-4 border-yellow-500">
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="text-xl font-bold uppercase mb-2">Ready to Process</h3>
            <p className="font-mono text-sm text-muted-fg mb-4">
              Your video is uploaded and ready for AI analysis
            </p>
            <ProcessButton videoId={video.id} />
          </CardContent>
        </Card>
      )}

      {/* Status Card */}
      {isProcessing ? (
        <ProcessingStatus
          videoId={video.id}
          initialProgress={video.progress}
          accuracyLevel={video.accuracy_level}
        />
      ) : (
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                {isCompleted && <CheckCircle className="w-8 h-8 text-green-500" />}
                {isPending && <Clock className="w-8 h-8 text-gray-500" />}
                {isFailed && <AlertCircle className="w-8 h-8 text-red-500" />}

                <div>
                  <h3 className="text-xl font-bold uppercase">
                    {isCompleted && 'Analysis Complete'}
                    {isPending && 'Waiting to Process'}
                    {isFailed && 'Processing Failed'}
                  </h3>
                  <p className="font-mono text-sm text-muted-fg mt-1">
                    {isCompleted && video.video_analysis && `${video.video_analysis.length} frames analyzed`}
                    {isPending && 'Your video is in the queue'}
                    {isFailed && video.error_message}
                  </p>
                </div>
              </div>

              <div>
                {isCompleted && <Badge variant="success">Completed</Badge>}
                {isPending && <Badge variant="secondary">Pending</Badge>}
                {isFailed && <Badge variant="destructive">Failed</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Info Grid */}
      <div className={`grid grid-cols-1 ${isCompleted && video.processing_cost_usd ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 mb-8`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase">File Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between font-mono text-sm">
              <span className="text-muted-fg">Size</span>
              <span>{video.file_size ? formatFileSize(video.file_size) : '-'}</span>
            </div>
            <div className="flex justify-between font-mono text-sm">
              <span className="text-muted-fg">Duration</span>
              <span>{video.duration_seconds ? formatDuration(video.duration_seconds) : '-'}</span>
            </div>
            <div className="flex justify-between font-mono text-sm">
              <span className="text-muted-fg">Uploaded</span>
              <span>{formatDate(video.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase">Analysis Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {video.analysis_scope}
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Video Player with AI Search (if completed) */}
      {isCompleted && video.url && video.video_analysis && video.video_analysis.length > 0 && (
        <VideoAnalysisView video={video} />
      )}

      {/* Fallback if analysis data is missing */}
      {isCompleted && video.url && (!video.video_analysis || video.video_analysis.length === 0) && (
        <Card className="mb-8 border-4 border-orange-500">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
            <h3 className="text-xl font-bold uppercase mb-2">Analysis Data Not Found</h3>
            <p className="font-mono text-sm text-muted-fg mb-4">
              The video was processed but analysis data is missing.
              This might happen if the processing was interrupted.
            </p>
            <p className="font-mono text-xs text-muted-fg">
              You may need to reprocess this video to enable search functionality.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Simple Video Preview (if not completed) */}
      {!isCompleted && video.url && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Video Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted border-4 border-border aspect-video flex items-center justify-center">
              <video
                controls
                className="w-full h-full"
                src={video.url.startsWith('file://') ? `/api/video/${video.id}/stream` : video.url}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        {video.url && (
          <a href={video.url} download>
            <Button variant="secondary" className="brutal-shadow">
              <Download className="w-4 h-4 mr-2" />
              Download Video
            </Button>
          </a>
        )}
        <DeleteButton videoId={video.id} />
      </div>
    </div>
  );
}