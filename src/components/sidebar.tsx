import { createClient } from '@/lib/supabase/server';
import { SidebarClient } from './SidebarClient';
import { getAutumnUsage } from '@/lib/autumn/server';
import { calculateValueMetrics } from '@/lib/credit-utils';

async function getSidebarData() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      processingVideos: [],
      usage: {
        creditsUsed: 0,
        creditsLimit: 1000,
        creditsBalance: 1000,
        percentageUsed: 0,
        isExceeded: false,
        valueMetrics: calculateValueMetrics(1000)
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

  // Get credit usage from Autumn
  const autumnUsage = await getAutumnUsage(user.id);
  const valueMetrics = calculateValueMetrics(autumnUsage.balance);

  const usage = {
    creditsUsed: autumnUsage.used,
    creditsLimit: autumnUsage.limit,
    creditsBalance: autumnUsage.balance,
    percentageUsed: autumnUsage.limit > 0 ? (autumnUsage.used / autumnUsage.limit) * 100 : 0,
    isExceeded: autumnUsage.balance <= 0,
    valueMetrics
  };

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