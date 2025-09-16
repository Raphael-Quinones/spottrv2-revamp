import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Maximum file size in bytes (500MB)
const MAX_FILE_SIZE = 524288000;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check usage limits
    const { data: usageCheck } = await supabase
      .rpc('check_usage_limit', { p_user_id: user.id });

    if (usageCheck?.[0]?.is_exceeded) {
      return NextResponse.json(
        { error: 'Monthly usage limit exceeded. Please upgrade your subscription.' },
        { status: 403 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('video') as File;
    const prompt = formData.get('prompt') as string;
    const accuracy = formData.get('accuracy') as string;
    const frameInterval = parseFloat(formData.get('frameInterval') as string);

    if (!file || !prompt || !accuracy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/mov'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP4, AVI, and MOV files are supported.' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 500MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${user.id}/${timestamp}_${sanitizedName}`;

    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName);

    // Create video record in database
    const { data: videoRecord, error: dbError } = await supabase
      .from('videos')
      .insert({
        user_id: user.id,
        filename: file.name,
        url: urlData.publicUrl,
        file_size: file.size,
        status: 'pending',
        accuracy_level: accuracy as any,
        analysis_scope: prompt,
        frame_interval: frameInterval || 0.5,
        progress: 0
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to delete uploaded file on database error
      await supabase.storage.from('videos').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to create video record' },
        { status: 500 }
      );
    }

    // Add to processing queue
    const { error: queueError } = await supabase
      .from('processing_queue')
      .insert({
        video_id: videoRecord.id,
        priority: accuracy === 'full' ? 1 : accuracy === 'mini' ? 2 : 3
      });

    if (queueError) {
      console.error('Queue error:', queueError);
      // Don't fail the upload, just log the error
    }

    // Estimate processing time based on file size and accuracy
    const estimatedMinutes = Math.ceil(
      (file.size / 1024 / 1024) * // Size in MB
      (accuracy === 'full' ? 0.5 : accuracy === 'mini' ? 0.3 : 0.2) * // Accuracy multiplier
      (0.5 / frameInterval) // Frame interval multiplier
    );

    // Increment usage tracking (estimate based on file size)
    const estimatedVideoMinutes = Math.ceil(file.size / 1024 / 1024 / 10); // Rough estimate
    await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_minutes: estimatedVideoMinutes,
      p_video_count: 1
    });

    return NextResponse.json({
      success: true,
      video: {
        id: videoRecord.id,
        filename: videoRecord.filename,
        status: videoRecord.status,
        estimatedProcessingTime: estimatedMinutes
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}