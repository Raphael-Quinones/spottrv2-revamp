import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAutumnSubscription } from '@/lib/autumn/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get subscription info
  const subscription = await getAutumnSubscription(user.id);
  const tier = subscription?.productId === 'spottr_pro' ? 'pro' :
               subscription?.productId === 'spottr_enterprise' ? 'enterprise' : 'free';

  return (
    <div className="min-h-screen bg-bg">
      <Navbar subscriptionTier={tier} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}