'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getDashboardStats() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get user profile with subscription tier
  const { data: userProfile } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  // Get total videos count
  const { count: totalVideos } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Get videos processed today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: processedToday } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('processed_at', today.toISOString());

  // Get usage for current month
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  // Try to create usage record if doesn't exist
  try {
    await supabase.rpc('get_or_create_usage_record', {
      p_user_id: user.id
    });
  } catch (err) {
    console.log('Usage record may already exist:', err);
  }

  const { data: usageData } = await supabase
    .from('usage_tracking')
    .select('minutes_used, video_count')
    .eq('user_id', user.id)
    .eq('month', currentMonth.toISOString().split('T')[0])
    .single();

  // Determine usage limit based on subscription tier
  const tier = userProfile?.subscription_tier || 'free';
  let minutesLimit = 10; // default free tier

  switch (tier) {
    case 'pro':
      minutesLimit = 100;
      break;
    case 'enterprise':
      minutesLimit = 999999; // effectively unlimited
      break;
  }

  // Ensure we return valid numbers
  const minutesUsed = Number(usageData?.minutes_used) || 0;

  return {
    totalVideos: totalVideos || 0,
    processedToday: processedToday || 0,
    minutesUsed: minutesUsed,
    minutesLimit: minutesLimit,
    videoCount: usageData?.video_count || 0,
    subscriptionTier: tier,
  };
}

export async function getRecentVideos(limit = 5) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get recent videos with all necessary data
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent videos:', error);
    return [];
  }

  return videos || [];
}

export async function getAllVideos() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get all videos
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
    return [];
  }

  return videos || [];
}

export async function getUserUsage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // First ensure user has a usage record for current month
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  // Try to create record if doesn't exist (will do nothing if exists)
  try {
    await supabase.rpc('get_or_create_usage_record', {
      p_user_id: user.id
    });
  } catch (err) {
    console.log('Usage record may already exist:', err);
  }

  // Call the check_usage_limit function
  const { data, error } = await supabase
    .rpc('check_usage_limit', { p_user_id: user.id });

  if (error) {
    console.error('Error checking usage limit:', error);
    // Return defaults on error
    return {
      isExceeded: false,
      minutesUsed: 0,
      minutesLimit: 10,
      percentageUsed: 0,
    };
  }

  // Ensure we return valid numbers
  const result = data?.[0] || {};

  return {
    isExceeded: result.is_exceeded === true,
    minutesUsed: Number(result.minutes_used) || 0,
    minutesLimit: Number(result.minutes_limit) || 10,
    percentageUsed: Number(result.percentage_used) || 0,
  };
}

export async function deleteVideo(videoId: string) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Delete video (will cascade delete analysis and queue entries)
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting video:', error);
    throw new Error('Failed to delete video');
  }

  return { success: true };
}

export async function getVideoById(videoId: string) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get video with analysis data
  const { data: video, error } = await supabase
    .from('videos')
    .select(`
      *,
      video_analysis (
        id,
        timestamp,
        frame_number,
        analysis_result,
        tokens_used
      )
    `)
    .eq('id', videoId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching video:', error);
    return null;
  }

  return video;
}