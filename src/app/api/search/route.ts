import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { calculateCredits } from '@/lib/credit-utils';
import { checkAutumnCredits, trackAutumnCredits } from '@/lib/autumn/credits';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// Helper to format timestamp for display
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Merge adjacent timestamp ranges
function mergeTimestampRanges(matches: any[], frameInterval: number) {
  if (!matches || matches.length === 0) return [];

  // Sort by timestamp
  const sortedMatches = [...matches].sort((a, b) => a.timestamp - b.timestamp);

  // Don't merge if frame interval is large (> 60 seconds)
  // Just create individual ranges for each match
  if (frameInterval > 60) {
    return sortedMatches.map(match => ({
      start: match.timestamp,
      end: match.timestamp + frameInterval,
      startFormatted: formatTime(match.timestamp),
      endFormatted: formatTime(match.timestamp + frameInterval),
      contexts: [match.context],
      frames: [match.frame]
    }));
  }

  // For smaller intervals, merge adjacent matches
  const ranges: any[] = [];
  let currentRange = {
    start: sortedMatches[0].timestamp,
    end: sortedMatches[0].timestamp + frameInterval,
    contexts: [sortedMatches[0].context],
    frames: [sortedMatches[0].frame]
  };

  for (let i = 1; i < sortedMatches.length; i++) {
    const match = sortedMatches[i];

    // If within interval (or adjacent), merge
    if (match.timestamp <= currentRange.end + frameInterval) {
      currentRange.end = match.timestamp + frameInterval;
      currentRange.contexts.push(match.context);
      currentRange.frames.push(match.frame);
    } else {
      // Save current range and start new one
      ranges.push({
        ...currentRange,
        startFormatted: formatTime(currentRange.start),
        endFormatted: formatTime(currentRange.end)
      });
      currentRange = {
        start: match.timestamp,
        end: match.timestamp + frameInterval,
        contexts: [match.context],
        frames: [match.frame]
      };
    }
  }

  // Don't forget the last range
  ranges.push({
    ...currentRange,
    startFormatted: formatTime(currentRange.start),
    endFormatted: formatTime(currentRange.end)
  });

  return ranges;
}

// Search with GPT-5 nano using chunked processing
async function searchWithGPT5(analyses: any[], query: string, frameInterval: number) {
  // Format analyses for GPT-5
  const formattedAnalyses = analyses.map(a => ({
    timestamp: a.timestamp,
    frame: a.frame_number,
    data: a.analysis_result
  }));

  console.log(`\n🔍 === AI SEARCH ===`);
  console.log(`Query: "${query}"`);
  console.log(`Analyzing ${analyses.length} frames with GPT-5 nano...`);
  console.log(`Frame interval: ${frameInterval} seconds`);

  // Split into chunks of 40 frames to avoid token limits
  const CHUNK_SIZE = 40;
  const chunks: any[][] = [];

  for (let i = 0; i < formattedAnalyses.length; i += CHUNK_SIZE) {
    chunks.push(formattedAnalyses.slice(i, i + CHUNK_SIZE));
  }

  console.log(`📦 Split into ${chunks.length} chunks of up to ${CHUNK_SIZE} frames each`);

  // Track total tokens for credit calculation
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Process chunks in parallel
  const searchChunk = async (chunk: any[], chunkIndex: number) => {
    console.log(`  🔍 Processing chunk ${chunkIndex + 1}/${chunks.length} (${chunk.length} frames)`);
    console.log(`     Time range: ${formatTime(chunk[0].timestamp)} - ${formatTime(chunk[chunk.length - 1].timestamp)}`);

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano',
        messages: [{
          role: 'user',
          content: `You are analyzing video frame data to find specific moments.

Video Analysis Data (Chunk ${chunkIndex + 1}/${chunks.length}):
${JSON.stringify(chunk, null, 2)}

User Query: "${query}"

Instructions:
1. Analyze the video data and find ALL timestamps where the query matches
2. Use the EXACT "timestamp" value from the data - DO NOT calculate or convert timestamps
3. Consider object types, colors, positions, actions, and context
4. For spatial queries like "right lane" or "left side", consider positioning in the frame
5. Be thorough - include all relevant matches
6. IMPORTANT: Do NOT mention frame numbers in your context descriptions - only describe what was found

CRITICAL: Use the exact timestamp values from the input data. For example:
- If the data shows {"timestamp": 4500, "frame": 15, ...}, use timestamp: 4500
- DO NOT convert or recalculate timestamps

Return JSON with this exact structure:
{
  "matches": [
    {"timestamp": 4500, "frame": 15, "context": "Red Toyota Camry in the right lane"},
    {"timestamp": 4200, "frame": 14, "context": "Multiple vehicles visible on highway"}
  ]
}

Note: The "frame" field is required for internal use, but do NOT mention frame numbers in the "context" descriptions.

If no matches found, return: {"matches": []}`
        }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{"matches": []}');

      // Validate and fix timestamps
      if (result.matches && result.matches.length > 0) {
        result.matches.forEach((match: any) => {
          const originalFrame = chunk.find((a: any) => a.frame === match.frame);
          if (originalFrame && originalFrame.timestamp !== match.timestamp) {
            console.log(`     ⚠️ Fixing timestamp for frame ${match.frame}: ${match.timestamp}s → ${originalFrame.timestamp}s`);
            match.timestamp = originalFrame.timestamp;
          }
        });
      }

      console.log(`     ✅ Chunk ${chunkIndex + 1}: Found ${result.matches?.length || 0} matches`);

      // Log token usage
      const tokens = response.usage;
      console.log(`     📊 Tokens: Input: ${tokens?.prompt_tokens}, Output: ${tokens?.completion_tokens}`);

      // Track tokens for credit calculation
      totalInputTokens += tokens?.prompt_tokens || 0;
      totalOutputTokens += tokens?.completion_tokens || 0;

      return result.matches || [];
    } catch (error) {
      console.error(`     ❌ Error in chunk ${chunkIndex + 1}:`, error);
      return [];
    }
  };

  try {
    // Process all chunks in parallel
    console.log('\n🚀 Processing chunks in parallel...');
    const chunkResults = await Promise.all(
      chunks.map((chunk, index) => searchChunk(chunk, index))
    );

    // Combine all matches from all chunks
    const allMatches = chunkResults.flat();

    console.log(`\n✅ Search complete! Total matches found: ${allMatches.length}`);
    console.log(`📊 Total tokens used - Input: ${totalInputTokens}, Output: ${totalOutputTokens}`);

    if (allMatches.length > 0) {
      console.log('\n📍 All matches:');
      allMatches.forEach((match: any, index: number) => {
        const minutes = Math.floor(match.timestamp / 60);
        const seconds = match.timestamp % 60;
        console.log(`  Match ${index + 1}: Timestamp ${match.timestamp}s (${minutes}:${seconds.toFixed(1)})`);
        console.log(`    Frame: ${match.frame}, Context: "${match.context}"`);
      });
    }

    return {
      matches: allMatches,
      tokens: {
        input: totalInputTokens,
        output: totalOutputTokens
      }
    };
  } catch (error) {
    console.error('❌ Search error:', error);
    throw error;
  }
}

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

    const { videoId, query } = await request.json();

    if (!videoId || !query) {
      return NextResponse.json(
        { error: 'Missing videoId or query' },
        { status: 400 }
      );
    }

    // Verify user owns the video
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, user_id, frame_interval, duration_seconds, filename')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Fetch all frame analyses
    const { data: analyses, error: analysesError } = await supabase
      .from('video_analysis')
      .select('timestamp, frame_number, analysis_result')
      .eq('video_id', videoId)
      .order('timestamp');

    if (analysesError) {
      console.error('Database error:', analysesError);
      return NextResponse.json(
        { error: 'Failed to fetch video analysis' },
        { status: 500 }
      );
    }

    if (!analyses || analyses.length === 0) {
      return NextResponse.json({
        ranges: [],
        totalMatches: 0,
        message: 'No analysis data available for this video'
      });
    }

    // Check credit balance via Autumn before searching
    // Estimate: ~10 credits per search (rough estimate)
    const estimatedCredits = 10;

    const creditCheck = await checkAutumnCredits(user.id, estimatedCredits);

    if (!creditCheck.allowed) {
      return NextResponse.json({
        error: creditCheck.message || 'Insufficient credits',
        balance: creditCheck.balance,
        required: estimatedCredits
      }, { status: 402 });
    }

    console.log(`💳 Credit check passed. Balance: ${creditCheck.balance}, Estimated usage: ${estimatedCredits}`);

    // Call GPT-5 nano for intelligent search
    const searchResults = await searchWithGPT5(
      analyses,
      query,
      video.frame_interval || 0.5
    );

    // Calculate and deduct credits
    if (searchResults.tokens) {
      const creditsUsed = calculateCredits(searchResults.tokens.input, searchResults.tokens.output);

      // Track credits with Autumn
      const trackResult = await trackAutumnCredits(user.id, creditsUsed, {
        operation: 'search',
        videoId: videoId,
        description: `Search query: "${query}" on ${video.filename || 'video'}`,
        inputTokens: searchResults.tokens.input,
        outputTokens: searchResults.tokens.output
      });

      if (!trackResult.success) {
        console.error('Failed to track credits with Autumn:', trackResult.error);
      } else {
        console.log(`💳 Credits tracked successfully with Autumn: ${creditsUsed} credits`);
      }

      // Log search to database
      await supabase.from('search_logs').insert({
        user_id: user.id,
        video_id: videoId,
        query: query,
        input_tokens: searchResults.tokens.input,
        output_tokens: searchResults.tokens.output,
        credits_used: creditsUsed,
        result_count: searchResults.matches?.length || 0
      });

      console.log(`💳 Credits Used: ${creditsUsed} ($${(creditsUsed * 0.001).toFixed(3)})`);
    }

    // Merge adjacent ranges
    const mergedRanges = mergeTimestampRanges(
      searchResults.matches || [],
      video.frame_interval || 0.5
    );

    // Debug: Log merged ranges
    console.log('\n🔗 Merged ranges:');
    mergedRanges.forEach((range: any, index: number) => {
      console.log(`  Range ${index + 1}: ${range.startFormatted} - ${range.endFormatted}`);
      console.log(`    Start: ${range.start}s, End: ${range.end}s`);
      console.log(`    Frames included: ${range.frames.join(', ')}`);
    });

    // Calculate search cost (rough estimate)
    const estimatedCost = 0.001; // Placeholder - adjust based on actual token usage

    console.log(`\n📋 Search Summary:`);
    console.log(`  • Query: "${query}"`);
    console.log(`  • Matches found: ${searchResults.matches?.length || 0}`);
    console.log(`  • Merged ranges: ${mergedRanges.length}`);
    console.log(`  • Video duration: ${video.duration_seconds}s`);
    console.log(`  • Frame interval: ${video.frame_interval}s`);
    console.log(`  • Estimated cost: $${estimatedCost.toFixed(6)}`);

    return NextResponse.json({
      ranges: mergedRanges,
      totalMatches: searchResults.matches?.length || 0,
      query: query,
      videoDuration: video.duration_seconds,
      frameInterval: video.frame_interval
    });

  } catch (error: any) {
    console.error('Search endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}