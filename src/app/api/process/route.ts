import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { calculateImageTokens, calculateCost, getModelName, type ModelName } from '@/lib/token-utils';

// Dynamic imports to avoid build issues
let ffmpeg: any;
let ffmpegPath: any;

const initFFmpeg = async () => {
  if (!ffmpeg) {
    ffmpeg = (await import('fluent-ffmpeg')).default;
    try {
      ffmpegPath = (await import('@ffmpeg-installer/ffmpeg')).default;
      ffmpeg.setFfmpegPath(ffmpegPath.path);
    } catch (error) {
      console.warn('FFmpeg installer not found, using system ffmpeg');
      // Will use system ffmpeg if available
    }
  }
  return ffmpeg;
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper: Get video duration
const getVideoDuration = async (videoPath: string): Promise<number> => {
  const ffmpeg = await initFFmpeg();
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err: any, metadata: any) => {
      if (err) reject(err);
      else resolve(metadata.format.duration || 0);
    });
  });
};

// Helper: Format duration from seconds to MM:SS
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper: Extract frames from video
const extractFrames = async (videoPath: string, frameInterval: number, videoId: string) => {
  const ffmpeg = await initFFmpeg();
  const duration = await getVideoDuration(videoPath);
  const frameCount = Math.floor(duration / frameInterval);
  const frames = [];

  console.log(`Extracting ${frameCount} frames at ${frameInterval}s intervals`);

  for (let i = 0; i < frameCount; i++) {
    const timestamp = i * frameInterval;
    const outputPath = `/tmp/${videoId}-frame-${i}.jpg`;

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(timestamp)
        .frames(1)
        // No size restriction - keep original dimensions
        .output(outputPath)
        .on('end', () => {
          console.log(`Extracted frame ${i + 1}/${frameCount}`);
          resolve();
        })
        .on('error', reject)
        .run();
    });

    frames.push({
      path: outputPath,
      timestamp: timestamp,
      frameNumber: i
    });
  }

  return frames;
};

// Helper: Create 1x3 grids with timestamps
const createGrids = async (frames: any[], videoId: string) => {
  const FRAMES_PER_GRID = 3;  // 1x3 grid
  const grids = [];

  // Get dimensions from first frame
  const firstFrameMetadata = await sharp(frames[0].path).metadata();
  const FRAME_WIDTH = firstFrameMetadata.width || 640;
  const FRAME_HEIGHT = firstFrameMetadata.height || 360;

  console.log(`Creating grids with frame dimensions: ${FRAME_WIDTH}x${FRAME_HEIGHT}`);

  for (let i = 0; i < frames.length; i += FRAMES_PER_GRID) {
    const batch = frames.slice(i, Math.min(i + FRAMES_PER_GRID, frames.length));

    // Create vertical grid with original dimensions
    const grid = sharp({
      create: {
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT * 3,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    });

    const composites = await Promise.all(
      batch.map(async (frame: any, idx: number) => {
        // Scale timestamp overlay based on frame size
        const fontSize = Math.max(16, Math.round(FRAME_WIDTH / 40));
        const boxWidth = Math.max(90, Math.round(FRAME_WIDTH / 7));
        const boxHeight = Math.max(30, Math.round(fontSize * 2));

        const timestampSvg = Buffer.from(`
          <svg width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}">
            <rect x="${FRAME_WIDTH - boxWidth - 10}" y="10"
                  width="${boxWidth}" height="${boxHeight}"
                  fill="rgba(0,0,0,0.7)" rx="5"/>
            <text x="${FRAME_WIDTH - (boxWidth/2) - 10}" y="${10 + (boxHeight/2) + (fontSize/3)}"
                  text-anchor="middle"
                  font-family="monospace"
                  font-size="${fontSize}"
                  fill="white"
                  font-weight="bold">
              ${formatDuration(frame.timestamp)}
            </text>
          </svg>
        `);

        // Load frame at original resolution
        const frameBuffer = await sharp(frame.path).toBuffer();

        // Add timestamp overlay
        const frameWithTimestamp = await sharp(frameBuffer)
          .composite([{
            input: timestampSvg,
            top: 0,
            left: 0
          }])
          .toBuffer();

        return {
          input: frameWithTimestamp,
          left: 0,
          top: idx * FRAME_HEIGHT
        };
      })
    );

    // Pad with black frames if needed
    while (composites.length < FRAMES_PER_GRID) {
      const blackFrame = await sharp({
        create: {
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          channels: 3,
          background: { r: 0, g: 0, b: 0 }
        }
      }).jpeg().toBuffer();

      composites.push({
        input: blackFrame,
        left: 0,
        top: composites.length * FRAME_HEIGHT
      });
    }

    const gridBuffer = await grid
      .composite(composites)
      .jpeg({ quality: 90 })  // Higher quality
      .toBuffer();

    grids.push({
      buffer: gridBuffer,
      startFrame: i,
      endFrame: Math.min(i + FRAMES_PER_GRID - 1, frames.length - 1),
      frames: batch
    });
  }

  console.log(`Created ${grids.length} grids`);
  return grids;
};

// Helper: Analyze with GPT-5
const analyzeWithGPT5 = async (grids: any[], video: any, updateProgress: (progress: number) => Promise<void>, supabase: any) => {
  const model = getModelName(video.accuracy_level);
  const allResults = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalImageTokens = 0;
  let totalCost = 0;

  console.log(`Analyzing with ${model}`);

  for (let gridIdx = 0; gridIdx < grids.length; gridIdx++) {
    const grid = grids[gridIdx];
    const base64 = grid.buffer.toString('base64');

    const frameDescriptions = grid.frames
      .map((f: any) => `Frame ${f.frameNumber}: ${formatDuration(f.timestamp)}`)
      .join(', ');

    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${video.analysis_scope}\n\nThis is a 1x3 grid showing 3 consecutive frames from a video. The frames are arranged vertically with timestamps in the upper right corner of each frame.\n\nFrames shown: ${frameDescriptions}\n\nAnalyze each frame and describe what you observe, referencing the timestamps. Return your analysis as a JSON object with frame numbers as keys.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`
              }
            }
          ]
        }],
        response_format: { type: "json_object" }
        // No max_tokens - let the model use as many as needed
        // No temperature - use default
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');

      // Extract token usage
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      const totalTokens = promptTokens + completionTokens;

      // Track totals
      totalInputTokens += promptTokens;
      totalOutputTokens += completionTokens;

      // Calculate cost for this grid
      const gridCost = calculateCost(model as ModelName, promptTokens, completionTokens);
      totalCost += gridCost.totalCost;

      // Log progress
      console.log(`Grid ${gridIdx + 1}/${grids.length}:`);
      console.log(`  Input: ${promptTokens.toLocaleString()} tokens`);
      console.log(`  Output: ${completionTokens.toLocaleString()} tokens`);
      console.log(`  Cost: $${gridCost.totalCost.toFixed(6)}`);

      // Store cost tracking data
      await supabase
        .from('processing_costs')
        .insert({
          video_id: video.id,
          model: model,
          input_tokens: promptTokens,
          output_tokens: completionTokens,
          image_tokens: 0, // Will calculate separately
          input_cost_usd: gridCost.inputCost,
          output_cost_usd: gridCost.outputCost,
          total_cost_usd: gridCost.totalCost,
          grid_number: gridIdx,
          frame_count: grid.frames.length
        });

      // Store results for each frame
      for (const frame of grid.frames) {
        allResults.push({
          timestamp: frame.timestamp,
          frame_number: frame.frameNumber,
          analysis_result: analysis[frame.frameNumber] || analysis,
          tokens_used: totalTokens, // Keep for compatibility
          input_tokens: Math.round(promptTokens / grid.frames.length),
          output_tokens: Math.round(completionTokens / grid.frames.length),
          model_used: model
        });
      }

      // Update progress
      const progress = 50 + Math.round((gridIdx / grids.length) * 40);
      await updateProgress(progress);

    } catch (error: any) {
      console.error(`Error analyzing grid ${gridIdx}:`, error.message);
      // Continue with next grid even if one fails
    }
  }

  // Log final summary
  console.log(`\n=== TOKEN USAGE SUMMARY ===`);
  console.log(`Total Input Tokens: ${totalInputTokens.toLocaleString()}`);
  console.log(`Total Output Tokens: ${totalOutputTokens.toLocaleString()}`);
  console.log(`Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`Grids Processed: ${grids.length}`);

  return {
    results: allResults,
    totals: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      cost: totalCost
    }
  };
};

// Helper: Download from Supabase Storage
const downloadFromSupabase = async (supabase: any, url: string): Promise<Buffer> => {
  const fileName = url.split('/').pop();
  const filePath = fileName?.includes('/') ? fileName : `videos/${fileName}`;

  const { data, error } = await supabase.storage
    .from('videos')
    .download(filePath);

  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
};

// Helper: Update progress
const updateProgress = async (supabase: any, videoId: string, progress: number) => {
  await supabase
    .from('videos')
    .update({ progress })
    .eq('id', videoId);
};

// Helper: Clean up temp files
const cleanupTempFiles = async (videoId: string) => {
  try {
    const tempDir = '/tmp';
    const files = await fs.readdir(tempDir);
    const videoFiles = files.filter(f => f.includes(videoId));

    for (const file of videoFiles) {
      await fs.unlink(path.join(tempDir, file)).catch(() => {});
    }

    console.log(`Cleaned up ${videoFiles.length} temp files`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

export async function POST(request: NextRequest) {
  const { videoId } = await request.json();

  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get video with user settings
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check status
    if (video.status !== 'pending') {
      return NextResponse.json({
        error: `Video is already ${video.status}`
      }, { status: 400 });
    }

    console.log(`Starting processing for video ${videoId}`);
    console.log(`Settings: accuracy=${video.accuracy_level}, interval=${video.frame_interval}s`);
    console.log(`Prompt: ${video.analysis_scope}`);

    // Update status to processing
    await supabase
      .from('videos')
      .update({
        status: 'processing',
        progress: 0
      })
      .eq('id', videoId);

    // Create update progress helper
    const progressUpdater = (progress: number) => updateProgress(supabase, videoId, progress);

    // Download video
    console.log('Downloading video from Supabase...');
    const videoBuffer = await downloadFromSupabase(supabase, video.url);
    const tempVideoPath = `/tmp/${videoId}.mp4`;
    await fs.writeFile(tempVideoPath, videoBuffer);
    await progressUpdater(10);

    // Extract frames at original resolution
    console.log('Extracting frames...');
    const frames = await extractFrames(
      tempVideoPath,
      video.frame_interval,
      videoId
    );
    await progressUpdater(30);

    // Create 1x3 grids with original dimensions
    console.log('Creating frame grids...');
    const grids = await createGrids(frames, videoId);
    await progressUpdater(50);

    // Analyze with GPT-5 - no token limit
    console.log('Analyzing with GPT-5...');
    const analysisData = await analyzeWithGPT5(grids, video, progressUpdater, supabase);
    const analysisResults = analysisData.results;
    const tokenTotals = analysisData.totals;
    await progressUpdater(90);

    // Store results
    console.log('Storing analysis results...');
    if (analysisResults.length > 0) {
      const { error: insertError } = await supabase
        .from('video_analysis')
        .insert(
          analysisResults.map(result => ({
            video_id: videoId,
            timestamp: result.timestamp,
            frame_number: result.frame_number,
            analysis_result: result.analysis_result,
            tokens_used: result.tokens_used,
            input_tokens: result.input_tokens,
            output_tokens: result.output_tokens,
            model_used: result.model_used
          }))
        );

      if (insertError) {
        console.error('Error storing analysis:', insertError);
      }
    }

    // Update video as completed with token tracking
    const duration = await getVideoDuration(tempVideoPath);
    await supabase
      .from('videos')
      .update({
        status: 'completed',
        progress: 100,
        duration_seconds: duration,
        processed_at: new Date().toISOString(),
        total_input_tokens: tokenTotals.inputTokens,
        total_output_tokens: tokenTotals.outputTokens,
        processing_cost_usd: tokenTotals.cost
      })
      .eq('id', videoId);

    console.log(`\n=== PROCESSING COMPLETE ===`);
    console.log(`Video Duration: ${formatDuration(duration)}`);
    console.log(`Processing Cost: $${tokenTotals.cost.toFixed(4)}`);
    console.log(`Cost per minute: $${(tokenTotals.cost / (duration / 60)).toFixed(4)}`);

    // Update usage
    await supabase.rpc('increment_usage', {
      p_user_id: video.user_id,
      p_minutes: duration / 60
    });

    // Clean up temp files
    await cleanupTempFiles(videoId);

    console.log(`Processing completed for video ${videoId}`);

    return NextResponse.json({
      success: true,
      framesAnalyzed: frames.length,
      gridsCreated: grids.length
    });

  } catch (error: any) {
    console.error('Processing error:', error);

    const supabase = await createClient();
    await supabase
      .from('videos')
      .update({
        status: 'failed',
        error_message: error.message,
        progress: 0
      })
      .eq('id', videoId);

    // Clean up temp files on error
    await cleanupTempFiles(videoId);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}