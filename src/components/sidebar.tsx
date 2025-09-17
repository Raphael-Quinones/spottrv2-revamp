import { createClient } from '@/lib/supabase/server';
import { SidebarClient } from './SidebarClient';

async function getSidebarData() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      processingVideos: [],
      usage: {
        minutesUsed: 0,
        minutesLimit: 10,
        percentageUsed: 0,
        isExceeded: false,
      }
    };
  }

  // Get processing/pending videos
  const { data: processingVideos } = await supabase
    .from('videos')
    .select('id, filename, status, progress')
    .eq('user_id', user.id)
    .in('status', ['processing', 'pending'])
    .order('created_at', { ascending: true })
    .limit(5);

  // Get current month for usage
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  // Try to create usage record if doesn't exist
  try {
    await supabase.rpc('get_or_create_usage_record', {
      p_user_id: user.id
    });
  } catch (err) {
    // Ignore error if record already exists
  }

  // Call the check_usage_limit function
  const { data: usageData, error } = await supabase
    .rpc('check_usage_limit', { p_user_id: user.id });

  let usage = {
    minutesUsed: 0,
    minutesLimit: 10,
    percentageUsed: 0,
    isExceeded: false,
  };

  if (!error && usageData?.[0]) {
    const result = usageData[0];
    usage = {
      minutesUsed: Number(result.minutes_used) || 0,
      minutesLimit: Number(result.minutes_limit) || 10,
      percentageUsed: Number(result.percentage_used) || 0,
      isExceeded: result.is_exceeded === true,
    };
  }

  return {
    processingVideos: processingVideos || [],
    usage,
  };
}

export async function Sidebar() {
  const { processingVideos, usage } = await getSidebarData();

  return (
    <SidebarClient
      processingVideos={processingVideos}
      usage={usage}
    />
  );
}