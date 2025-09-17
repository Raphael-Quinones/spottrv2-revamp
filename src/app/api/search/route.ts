import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

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

// Search with GPT-5 nano
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
  console.log(`First 3 frames:`, formattedAnalyses.slice(0, 3));
  console.log(`Last 3 frames:`, formattedAnalyses.slice(-3));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano', // Maximum context window
      messages: [{
        role: 'user',
        content: `You are analyzing video frame data to find specific moments.

Video Analysis Data:
${JSON.stringify(formattedAnalyses, null, 2)}

User Query: "${query}"

Instructions:
1. Analyze the video data and find ALL timestamps where the query matches
2. Use the EXACT "timestamp" value from the data - DO NOT calculate or convert timestamps
3. Consider object types, colors, positions, actions, and context
4. For spatial queries like "right lane" or "left side", consider positioning in the frame
5. Be thorough - include all relevant matches

CRITICAL: Use the exact timestamp values from the input data. For example:
- If the data shows {"timestamp": 4500, "frame": 15, ...}, use timestamp: 4500
- DO NOT convert or recalculate timestamps

Return JSON with this exact structure:
{
  "matches": [
    {"timestamp": 4500, "frame": 15, "context": "Description of what was found"},
    {"timestamp": 4200, "frame": 14, "context": "Another match description"}
  ]
}

If no matches found, return: {"matches": []}`
      }],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"matches": []}');
    console.log(`✅ Found ${result.matches?.length || 0} matches`);

    // Validate and fix timestamps if GPT-5 returns wrong values
    if (result.matches && result.matches.length > 0) {
      console.log('\n📍 Validating matches from GPT-5:');

      result.matches.forEach((match: any, index: number) => {
        // Find the actual timestamp from the original data
        const originalFrame = formattedAnalyses.find((a: any) => a.frame === match.frame);
        if (originalFrame && originalFrame.timestamp !== match.timestamp) {
          console.log(`  ⚠️ Fixing timestamp for frame ${match.frame}: ${match.timestamp}s → ${originalFrame.timestamp}s`);
          match.timestamp = originalFrame.timestamp;
        }

        const minutes = Math.floor(match.timestamp / 60);
        const seconds = match.timestamp % 60;
        console.log(`  Match ${index + 1}: Timestamp ${match.timestamp}s (${minutes}:${seconds.toFixed(1)})`);
        console.log(`    Frame: ${match.frame}, Context: "${match.context}"`);
      });
    }

    // Log token usage
    const tokens = response.usage;
    console.log(`\n📊 Tokens used: Input: ${tokens?.prompt_tokens}, Output: ${tokens?.completion_tokens}`);

    return result;
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
      .select('id, user_id, frame_interval, duration_seconds')
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

    // Call GPT-5 nano for intelligent search
    const searchResults = await searchWithGPT5(
      analyses,
      query,
      video.frame_interval || 0.5
    );

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