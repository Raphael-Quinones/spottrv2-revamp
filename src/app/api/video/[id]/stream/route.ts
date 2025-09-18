import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Get video details from database
    const { data: video, error } = await supabase
      .from('videos')
      .select('url, user_id, filename')
      .eq('id', params.id)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check if it's a demo video in public directory
    if (video.url.startsWith('/demo-videos/')) {
      const demoPath = path.join(process.cwd(), 'public', video.url);

      // Verify file exists
      try {
        await fs.access(demoPath);
      } catch {
        return NextResponse.json(
          { error: 'Demo video file not found' },
          { status: 404 }
        );
      }

      // Get file stats
      const stats = await stat(demoPath);
      const fileSize = stats.size;

      // Stream the demo video
      const range = request.headers.get('range');

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        const stream = createReadStream(demoPath, { start, end });

        return new NextResponse(stream as any, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize.toString(),
            'Content-Type': 'video/mp4',
          },
        });
      } else {
        const stream = createReadStream(demoPath);

        return new NextResponse(stream as any, {
          headers: {
            'Content-Length': fileSize.toString(),
            'Content-Type': 'video/mp4',
          },
        });
      }
    }

    // Check if it's a local file URL
    if (!video.url.startsWith('file://')) {
      // If it's a regular URL, redirect to it
      return NextResponse.redirect(video.url);
    }

    // Extract local file path from file:// URL
    const localPath = video.url.replace('file://', '');

    // Verify file exists
    try {
      await fs.access(localPath);
    } catch {
      return NextResponse.json(
        { error: 'Video file not found on server' },
        { status: 404 }
      );
    }

    // Get file stats for size and mime type
    const stats = await stat(localPath);
    const fileSize = stats.size;

    // Determine content type based on file extension
    const ext = path.extname(localPath).toLowerCase();
    const contentType = {
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm'
    }[ext] || 'video/mp4';

    // Handle range requests for video streaming
    const range = request.headers.get('range');

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      // Read the specific chunk
      const fileBuffer = await fs.readFile(localPath);
      const chunk = fileBuffer.subarray(start, end + 1);

      // Return partial content
      return new NextResponse(chunk as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // No range request - return entire file
    const fileBuffer = await fs.readFile(localPath);

    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Video streaming error:', error);
    return NextResponse.json(
      { error: 'Failed to stream video' },
      { status: 500 }
    );
  }
}