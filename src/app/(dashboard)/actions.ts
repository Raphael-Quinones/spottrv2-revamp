'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatCredits, calculateValueMetrics, formatRemainingCredits } from '@/lib/credit-utils';
import { getAutumnUsage, getAutumnSubscription } from '@/lib/autumn/server';

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

  // Get credit usage from Autumn
  const autumnUsage = await getAutumnUsage(user.id);
  const creditsBalance = autumnUsage.balance;
  const creditsUsed = autumnUsage.used;
  const creditsPurchased = autumnUsage.limit;

  // Get subscription info from Autumn
  const subscription = await getAutumnSubscription(user.id);
  const tier = subscription?.productId === 'spottr_pro' ? 'pro' :
               subscription?.productId === 'spottr_enterprise' ? 'enterprise' : 'free';

  // Get video count from database (still stored there)
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const { data: usageData } = await supabase
    .from('usage_tracking')
    .select('total_input_tokens, total_output_tokens, video_count')
    .eq('user_id', user.id)
    .eq('month', currentMonth.toISOString().split('T')[0])
    .single();

  // Calculate value metrics
  const valueMetrics = calculateValueMetrics(creditsBalance);

  return {
    totalVideos: totalVideos || 0,
    processedToday: processedToday || 0,
    creditsBalance: creditsBalance,
    creditsUsed: creditsUsed,
    creditsPurchased: creditsPurchased,
    totalInputTokens: usageData?.total_input_tokens || 0,
    totalOutputTokens: usageData?.total_output_tokens || 0,
    videoCount: usageData?.video_count || 0,
    subscriptionTier: tier,
    valueMetrics: valueMetrics,
    formattedCredits: formatCredits(creditsBalance),
    formattedRemaining: formatRemainingCredits(creditsBalance),
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
  // Include both user's videos and demo videos
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .or(`user_id.eq.${user.id},is_demo.eq.true`)
    .order('is_demo', { ascending: false }) // Show demo videos first
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

  // Get credit usage from Autumn
  const autumnUsage = await getAutumnUsage(user.id);
  const creditsBalance = autumnUsage.balance;
  const creditsUsed = autumnUsage.used;
  const creditsPurchased = autumnUsage.limit;
  const percentageUsed = creditsPurchased > 0 ? (creditsUsed / creditsPurchased) * 100 : 0;

  // Check if credits are exhausted (less than 100 credits remaining)
  const isExceeded = creditsBalance < 100;

  return {
    isExceeded,
    creditsBalance,
    creditsUsed,
    creditsPurchased,
    percentageUsed: Math.round(percentageUsed),
    formattedCredits: formatCredits(creditsBalance),
    formattedRemaining: formatRemainingCredits(creditsBalance),
  };
}

export async function deleteVideo(videoId: string) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Check if this is a demo video
  const { data: video } = await supabase
    .from('videos')
    .select('is_demo')
    .eq('id', videoId)
    .single();

  if (video?.is_demo) {
    throw new Error('Demo videos cannot be deleted');
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

export async function getBillingData() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get user profile with subscription info
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Get credit usage from Autumn
  const autumnUsage = await getAutumnUsage(user.id);
  const creditsBalance = autumnUsage.balance;
  const creditsUsed = autumnUsage.used;
  const creditsPurchased = autumnUsage.limit;

  // Get subscription info from Autumn
  const subscription = await getAutumnSubscription(user.id);
  const tier = subscription?.productId === 'spottr_pro' ? 'pro' :
               subscription?.productId === 'spottr_enterprise' ? 'enterprise' : 'free';

  // Calculate next billing date (first of next month)
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  nextBilling.setDate(1);

  // Get token usage from database (still tracked there for now)
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('total_input_tokens, total_output_tokens, video_count')
    .eq('user_id', user.id)
    .eq('month', currentMonth.toISOString().split('T')[0])
    .single();

  // For now, return empty transactions since they're in Autumn
  // TODO: Fetch from Autumn API when available
  const recentTransactions: any[] = [];

  // Calculate value metrics
  const valueMetrics = calculateValueMetrics(creditsBalance);

  // Get plan details based on tier
  const planDetails = tier === 'free'
    ? { name: 'Free', price: 0 }
    : tier === 'pro'
    ? { name: 'Pro', price: 29.00 }
    : { name: 'Enterprise', price: 99.00 };

  return {
    currentPlan: {
      tier: tier,
      name: planDetails.name,
      price: planDetails.price,
      creditsBalance: creditsBalance,
      creditsUsed: creditsUsed,
      creditsPurchased: creditsPurchased,
      videoCount: usage?.video_count || 0,
      nextBilling: nextBilling.toISOString().split('T')[0],
      isActive: true,
      valueMetrics: valueMetrics,
      formattedCredits: formatCredits(creditsBalance),
    },
    user: {
      email: userProfile?.email || user.email,
      createdAt: userProfile?.created_at,
      stripeCustomerId: userProfile?.stripe_customer_id,
    },
    recentTransactions: recentTransactions || [],
    tokenUsage: {
      inputTokens: usage?.total_input_tokens || 0,
      outputTokens: usage?.total_output_tokens || 0,
    },
  };
}

export async function getDemoVideo() {
  const supabase = await createClient();

  // Get the demo video with analysis count
  const { data: video, error } = await supabase
    .from('videos')
    .select(`
      *,
      video_analysis (
        id
      )
    `)
    .eq('id', '5728109e-abb3-43af-b0ff-88360b9a5adc')
    .eq('is_demo', true)
    .single();

  if (error) {
    console.error('Error fetching demo video:', error);
    return null;
  }

  // Add analysis count
  if (video && video.video_analysis) {
    return {
      ...video,
      analysisCount: video.video_analysis.length,
      video_analysis: undefined // Remove the array to keep response light
    };
  }

  return video;
}

export async function getVideoById(videoId: string) {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get video with analysis data
  // First try to get the video
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
    .single();

  if (error) {
    console.error('Error fetching video:', error);
    return null;
  }

  // Check if user has access (owns it or it's a demo)
  if (video && !video.is_demo && video.user_id !== user.id) {
    console.error('Access denied: User does not own this video');
    return null;
  }

  return video;
}