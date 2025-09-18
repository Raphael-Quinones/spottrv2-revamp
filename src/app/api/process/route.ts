import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import { calculateImageTokens, calculateCost, getModelName, type ModelName } from '@/lib/token-utils';

// Configuration flags
const SAVE_DEBUG_GRIDS = false; // Set to true to save debug grids (not needed for analysis)

// Dynamic imports to avoid build issues
let ffmpeg: any;

const initFFmpeg = async () => {
  if (!ffmpeg) {
    // Import fluent-ffmpeg dynamically
    ffmpeg = (await import('fluent-ffmpeg')).default;

    // Try to use bundled binaries, fall back to system if not available
    try {
      // These requires will be evaluated at runtime, not build time
      const ffmpegPath = eval("require('@ffmpeg-installer/ffmpeg')").path;
      const ffprobePath = eval("require('@ffprobe-installer/ffprobe')").path;

      ffmpeg.setFfmpegPath(ffmpegPath);
      ffmpeg.setFfprobePath(ffprobePath);

      console.log('Using bundled ffmpeg from npm packages');
    } catch (error) {
      console.warn('FFmpeg installer packages not found, using system ffmpeg');
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

  // Create organized directory structure
  const framesDir = path.join('/tmp/spottr-videos', videoId, 'frames');
  await fs.mkdir(framesDir, { recursive: true });

  console.log(`  📊 Video duration: ${formatDuration(duration)}`);
  console.log(`  🎬 Total frames to extract: ${frameCount}`);
  console.log(`  ⏱️  Interval: every ${frameInterval}s`);
  console.log(`  📁 Saving frames to: ${framesDir}`);

  for (let i = 0; i < frameCount; i++) {
    const timestamp = i * frameInterval;
    const outputPath = path.join(framesDir, `frame-${i}.jpg`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(timestamp)
        .frames(1)
        // No size restriction - keep original dimensions
        .output(outputPath)
        .on('end', () => {
          if (i % 10 === 0 || i === frameCount - 1) {
            console.log(`  📸 Progress: ${i + 1}/${frameCount} frames (${Math.round((i + 1) / frameCount * 100)}%)`);
          }
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

  // Create grids directory
  const gridsDir = path.join('/tmp/spottr-videos', videoId, 'grids');
  await fs.mkdir(gridsDir, { recursive: true });

  // Get dimensions from first frame
  const firstFrameMetadata = await sharp(frames[0].path).metadata();
  const FRAME_WIDTH = firstFrameMetadata.width || 640;
  const FRAME_HEIGHT = firstFrameMetadata.height || 360;

  console.log(`Creating grids with frame dimensions: ${FRAME_WIDTH}x${FRAME_HEIGHT}`);
  console.log(`📁 Saving grids to: ${gridsDir}`);

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

    // Save grid to disk
    const gridIndex = Math.floor(i / FRAMES_PER_GRID);
    const gridPath = path.join(gridsDir, `grid-${gridIndex}.jpg`);
    await fs.writeFile(gridPath, gridBuffer);

    if (gridIndex % 5 === 0 || gridIndex === Math.floor((frames.length - 1) / FRAMES_PER_GRID)) {
      console.log(`  💾 Saved grid ${gridIndex} (frames ${i}-${Math.min(i + FRAMES_PER_GRID - 1, frames.length - 1)})`);
    }

    grids.push({
      buffer: gridBuffer,
      path: gridPath,  // Add path reference
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
  const allResults: any[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalImageTokens = 0;
  let totalCost = 0;

  console.log(`  🤖 Model: ${model}`);
  console.log(`  📦 Total grids to analyze: ${grids.length}`);

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

      // Log the full GPT-5 analysis result
      console.log(`\n  🤖 === GPT-5 ANALYSIS RESULT (Grid ${gridIdx + 1}/${grids.length}) ===`);
      console.log(`  📍 Frames: ${grid.frames.map((f: any) => `${f.frameNumber} at ${f.timestamp}s`).join(', ')}`);
      console.log(`  📝 Full Response:`);
      console.log(JSON.stringify(analysis, null, 2));
      console.log(`  ================================\n`);

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
      if (gridIdx % 5 === 0 || gridIdx === grids.length - 1) {
        console.log(`  💰 Grid ${gridIdx + 1}/${grids.length} (${Math.round((gridIdx + 1) / grids.length * 100)}%):`);
        console.log(`     • Input: ${promptTokens.toLocaleString()} tokens`);
        console.log(`     • Output: ${completionTokens.toLocaleString()} tokens`);
        console.log(`     • Cost: $${gridCost.totalCost.toFixed(6)}`);
        console.log(`     • Running total: $${totalCost.toFixed(4)}`);
      }

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
      console.error(`  ⚠️  Error analyzing grid ${gridIdx + 1}:`, error.message);
      // Continue with next grid even if one fails
    }
  }

  // Log final summary
  console.log(`\n  📊 === TOKEN USAGE SUMMARY ===`);
  console.log(`  • Total Input Tokens: ${totalInputTokens.toLocaleString()}`);
  console.log(`  • Total Output Tokens: ${totalOutputTokens.toLocaleString()}`);
  console.log(`  • Total Cost: $${totalCost.toFixed(4)}`);
  console.log(`  • Grids Processed: ${grids.length}`);

  return {
    results: allResults,
    totals: {
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      cost: totalCost
    }
  };
};

// Helper: Process single frame with retry logic
const processOneFrame = async (frame: any, video: any, model: string, adminSupabase: any, retries = 3) => {
  // Check if frame already processed (race condition protection)
  const existingCheck = await adminSupabase
    .from('video_analysis')
    .select('id')
    .eq('video_id', video.id)
    .eq('frame_number', frame.frameNumber)
    .single();

  if (existingCheck.data) {
    console.log(`  ⏭️ Frame ${frame.frameNumber} already processed, skipping`);
    return { success: true, skipped: true };
  }

  // Retry loop for rate limit handling
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Read frame data just-in-time to avoid memory issues
      const frameBuffer = await fs.readFile(frame.path);
      const base64 = frameBuffer.toString('base64');

      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${video.analysis_scope}

This is frame ${frame.frameNumber} at ${frame.timestamp} seconds in the video.

Analyze what you observe in this frame. Focus only on the visual content - do not include frame numbers or timestamps in your response.

Return your analysis as a JSON object with relevant observations about objects, people, vehicles, text, and scene context.`
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
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      const tokens = response.usage;

      // Calculate token costs
      const promptTokens = tokens?.prompt_tokens || 0;
      const completionTokens = tokens?.completion_tokens || 0;
      const frameCost = calculateCost(
        model as ModelName,
        promptTokens,
        completionTokens
      );

      // Store in database
      const { error: insertError } = await adminSupabase
        .from('video_analysis')
        .insert({
          video_id: video.id,
          timestamp: frame.timestamp,
          frame_number: frame.frameNumber,
          analysis_result: analysis,
          tokens_used: promptTokens + completionTokens,
          input_tokens: promptTokens,
          output_tokens: completionTokens,
          model_used: model
        });

      if (insertError) {
        throw new Error(`DB insert failed: ${insertError.message}`);
      }

      console.log(`  ✅ Frame ${frame.frameNumber} completed`);

      return {
        success: true,
        tokens: {
          input: promptTokens,
          output: completionTokens
        },
        cost: frameCost.totalCost
      };

    } catch (error: any) {
      // Handle rate limiting with exponential backoff
      if (error.status === 429 && attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`  ⏳ Frame ${frame.frameNumber} rate limited, retry ${attempt + 1}/${retries} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Final attempt failed
      if (attempt === retries) {
        console.error(`  ❌ Frame ${frame.frameNumber} failed after ${retries} retries: ${error.message}`);
        return { success: false, error: error.message };
      }
    }
  }

  return { success: false, error: 'Unknown error' };
};

// Helper: Analyze frames in parallel with smart concurrency control
const analyzeWithGPT5SingleFrames = async (frames: any[], video: any, updateProgress: (progress: number) => Promise<void>, supabase: any) => {
  const MAX_CONCURRENT = 15; // Process up to 15 frames simultaneously
  const model = getModelName(video.accuracy_level);

  console.log(`  🤖 Model: ${model}`);
  console.log(`  📦 Total frames to analyze: ${frames.length}`);
  console.log(`  🚀 Parallel processing with max ${MAX_CONCURRENT} concurrent requests`);

  // Import admin client for bypassing RLS
  const { createClient: createAdminClient } = await import('@/lib/supabase/admin');
  const adminSupabase = createAdminClient();

  // Check which frames are already processed
  const existingFrames = await adminSupabase
    .from('video_analysis')
    .select('frame_number')
    .eq('video_id', video.id);

  const processedSet = new Set(existingFrames.data?.map((r: any) => r.frame_number) || []);
  const framesToProcess = frames.filter(f => !processedSet.has(f.frameNumber));

  console.log(`  📊 Status: ${processedSet.size} already processed, ${framesToProcess.length} to process`);

  // If all frames already processed, just return totals
  if (framesToProcess.length === 0) {
    console.log(`  ✅ All frames already processed!`);
    return {
      results: [],
      totals: { inputTokens: 0, outputTokens: 0, cost: 0 }
    };
  }

  // Initialize totals for cost tracking
  const totals = {
    inputTokens: 0,
    outputTokens: 0,
    cost: 0
  };

  const allResults: any[] = [];
  let processedCount = processedSet.size;

  // Process frames in chunks to control concurrency
  for (let i = 0; i < framesToProcess.length; i += MAX_CONCURRENT) {
    const chunk = framesToProcess.slice(i, i + MAX_CONCURRENT);
    const chunkStartTime = Date.now();

    console.log(`\n  📦 Processing chunk ${Math.floor(i / MAX_CONCURRENT) + 1}/${Math.ceil(framesToProcess.length / MAX_CONCURRENT)} (${chunk.length} frames)`);

    // Process chunk in parallel
    const chunkResults = await Promise.allSettled(
      chunk.map(frame => processOneFrame(frame, video, model, adminSupabase))
    );

    // Process results and accumulate totals
    let chunkSuccesses = 0;
    let chunkFailures = 0;
    let chunkSkipped = 0;

    chunkResults.forEach((result, idx) => {
      if (result.status === 'fulfilled' && result.value) {
        if (result.value.success) {
          if (result.value.skipped) {
            chunkSkipped++;
          } else {
            chunkSuccesses++;
            allResults.push({ frame: chunk[idx].frameNumber, success: true });

            // Accumulate token counts and costs
            if (result.value.tokens) {
              totals.inputTokens += result.value.tokens.input || 0;
              totals.outputTokens += result.value.tokens.output || 0;
            }
            if (result.value.cost) {
              totals.cost += result.value.cost;
            }
          }
        } else {
          chunkFailures++;
          console.log(`    ⚠️ Frame ${chunk[idx].frameNumber} failed: ${result.value.error}`);
        }
      } else if (result.status === 'rejected') {
        chunkFailures++;
        console.log(`    ⚠️ Frame ${chunk[idx].frameNumber} rejected: ${result.reason}`);
      }
    });

    processedCount += chunkSuccesses;

    const chunkTime = (Date.now() - chunkStartTime) / 1000;
    console.log(`  ✅ Chunk complete in ${chunkTime.toFixed(1)}s: ${chunkSuccesses} succeeded, ${chunkSkipped} skipped, ${chunkFailures} failed`);

    // Update progress
    const progress = Math.round((processedCount / frames.length) * 100);
    await updateProgress(Math.min(progress, 99));

    // Log running totals
    if (totals.cost > 0) {
      console.log(`  💰 Running totals: ${totals.inputTokens.toLocaleString()} input, ${totals.outputTokens.toLocaleString()} output tokens, $${totals.cost.toFixed(4)}`);
    }

    // Small delay between chunks to avoid overwhelming the API
    if (i + MAX_CONCURRENT < framesToProcess.length) {
      console.log(`  ⏸️ Brief pause before next chunk...`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n  🎉 Parallel processing complete!`);
  console.log(`  📊 Final results: ${allResults.length} frames processed successfully`);

  return {
    results: allResults,
    totals: totals
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
const cleanupTempFiles = async (videoId: string, keepOriginal: boolean = false) => {
  try {
    const tempDir = '/tmp';
    const files = await fs.readdir(tempDir);
    // Only clean up frame files, not the original video if it's stored locally
    const videoFiles = files.filter(f => {
      if (keepOriginal && f.endsWith('.mp4') && !f.includes('frame')) {
        return false; // Skip original video files in dev mode
      }
      return f.includes(videoId);
    });

    for (const file of videoFiles) {
      await fs.unlink(path.join(tempDir, file)).catch(() => {});
    }

    console.log(`Cleaned up ${videoFiles.length} temp files (frames only)`);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};

export async function POST(request: NextRequest) {
  console.log('PROCESS ENDPOINT HIT!'); // Immediate log to verify endpoint is called

  const { videoId } = await request.json();

  console.log('\n🎬 === VIDEO PROCESSING STARTED ===' );
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`📹 Video ID: ${videoId}`);

  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('❌ Processing failed: User not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`👤 User ID: ${user.id}`);

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

    console.log('\n📊 === VIDEO DETAILS ===');
    console.log(`🎯 Accuracy Level: ${video.accuracy_level}`);
    console.log(`⏱️  Frame Interval: ${video.frame_interval}s`);
    console.log(`📝 Analysis Scope: ${video.analysis_scope}`);
    console.log(`🗂️  Storage Type: ${video.url.startsWith('file://') ? 'LOCAL (Dev Mode)' : 'Supabase'}`);

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

    // Download or read video
    let videoBuffer;
    let tempVideoPath;

    // DEV MODE: Check if video is stored locally
    if (video.url.startsWith('file://')) {
      // Local file - just use the path directly
      tempVideoPath = video.url.replace('file://', '');
      console.log(`DEV MODE: Using local video at ${tempVideoPath}`);

      // Verify file exists
      try {
        await fs.access(tempVideoPath);
      } catch (error) {
        console.error('Local video file not found:', tempVideoPath);
        throw new Error('Video file not found. It may have been deleted from /tmp');
      }
    } else {
      // Production mode - download from Supabase
      console.log('Downloading video from Supabase...');
      videoBuffer = await downloadFromSupabase(supabase, video.url);
      tempVideoPath = `/tmp/${videoId}.mp4`;
      await fs.writeFile(tempVideoPath, videoBuffer);
    }
    await progressUpdater(10);

    // Extract frames at original resolution
    console.log('\n🎞️  === FRAME EXTRACTION ===');
    console.log('Starting frame extraction...');
    const frames = await extractFrames(
      tempVideoPath,
      video.frame_interval,
      videoId
    );
    console.log(`✅ Extracted ${frames.length} frames successfully`);
    await progressUpdater(30);

    // Optional: Create grids for debugging
    if (SAVE_DEBUG_GRIDS) {
      console.log('\n🖼️  === DEBUG GRID CREATION ===');
      console.log('Creating frame grids for debugging...');
      const grids = await createGrids(frames, videoId);
      console.log(`✅ Created ${grids.length} debug grids (1x3 layout)`);
    }
    await progressUpdater(50);

    // Analyze individual frames with GPT-5
    console.log('\n🤖 === AI ANALYSIS (INDIVIDUAL FRAMES) ===');
    console.log(`Starting frame-by-frame analysis with GPT-5 (${video.accuracy_level} model)...`);
    console.log(`Analyzing ${frames.length} individual frames...`);
    const startTime = Date.now();
    const analysisData = await analyzeWithGPT5SingleFrames(frames, video, progressUpdater, supabase);
    const analysisResults = analysisData.results;
    const tokenTotals = analysisData.totals;
    const analysisTime = (Date.now() - startTime) / 1000;
    console.log(`✅ Analysis completed in ${analysisTime.toFixed(1)} seconds`);
    await progressUpdater(90);

    // Results already stored after each frame
    console.log('\n💾 === RESULTS SUMMARY ===');
    console.log(`✅ Processed and stored ${analysisResults.length} frame analyses`);

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

    console.log('\n🏁 === PROCESSING COMPLETE ===');
    console.log(`✅ Status: SUCCESS`);
    console.log(`⏱️  Video Duration: ${formatDuration(duration)}`);
    console.log(`🎞️  Frames Analyzed: ${frames.length} (individual frames)`);
    console.log(`💰 Processing Cost: $${tokenTotals.cost.toFixed(4)}`);
    console.log(`💵 Cost per frame: $${(tokenTotals.cost / frames.length).toFixed(6)}`);
    console.log(`📈 Cost per minute: $${(tokenTotals.cost / (duration / 60)).toFixed(4)}`);
    console.log(`⏰ Completed at: ${new Date().toISOString()}`);
    console.log('================================\n');

    // Update usage
    await supabase.rpc('increment_usage', {
      p_user_id: video.user_id,
      p_minutes: duration / 60
    });

    // Clean up temp files (keep original if it's stored locally)
    const isLocalVideo = video.url.startsWith('file://');
    await cleanupTempFiles(videoId, isLocalVideo);

    return NextResponse.json({
      success: true,
      framesAnalyzed: frames.length,
      analysisMethod: 'individual_frames'
    });

  } catch (error: any) {
    console.error('\n❌ === PROCESSING FAILED ===');
    console.error(`Error: ${error.message}`);
    console.error('Stack:', error.stack);
    console.error(`Failed at: ${new Date().toISOString()}`);
    console.error('================================\n');

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