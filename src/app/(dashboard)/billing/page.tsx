import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, TrendingUp, Calendar, Check, AlertCircle, FileVideo } from 'lucide-react';
import { getBillingData } from '../actions';
import { formatMinutes, formatDate, formatDuration } from '@/lib/utils';

export default async function BillingPage() {
  // Fetch real billing data
  const billingData = await getBillingData();
  const { currentPlan, user, recentActivity } = billingData;

  // Calculate usage percentage
  const usagePercentage = currentPlan.minutesLimit > 0
    ? Math.min((currentPlan.minutesUsed / currentPlan.minutesLimit) * 100, 100)
    : 0;

  // Define all available plans
  const plans = [
    {
      tier: 'free',
      name: 'Free',
      price: 0,
      minutes: 10,
      models: ['GPT-5 Nano'],
      features: ['Basic support', '0.5s frame intervals'],
      current: currentPlan.tier === 'free',
    },
    {
      tier: 'starter',
      name: 'Starter',
      price: 9.99,
      minutes: 30,
      models: ['GPT-5 Nano'],
      features: ['Email support', '0.5s frame intervals', 'Export results'],
      current: currentPlan.tier === 'starter',
    },
    {
      tier: 'pro',
      name: 'Pro',
      price: 29.99,
      minutes: 100,
      models: ['GPT-5 Nano', 'GPT-5 Mini'],
      features: ['Priority support', 'Custom frame intervals', 'API access', 'Batch processing'],
      current: currentPlan.tier === 'pro',
    },
    {
      tier: 'enterprise',
      name: 'Enterprise',
      price: 99.99,
      minutes: 500,
      models: ['All GPT-5 models'],
      features: ['24/7 support', 'Custom integration', 'SLA guarantee', 'Dedicated account manager'],
      current: currentPlan.tier === 'enterprise',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Billing</h1>
        <p className="font-mono text-sm text-muted-fg">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold uppercase">{currentPlan.name}</h3>
              <p className="font-mono text-sm text-muted-fg">
                {currentPlan.price > 0 ? `$${currentPlan.price}/month` : 'Free tier'}
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-mono text-sm">Minutes Used This Month</span>
                <span className="font-mono text-sm font-bold">
                  {formatMinutes(currentPlan.minutesUsed)} / {formatMinutes(currentPlan.minutesLimit)}
                </span>
              </div>
              <Progress value={usagePercentage} />
              {usagePercentage >= 80 && usagePercentage < 100 && (
                <p className="text-yellow-600 text-sm mt-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Approaching usage limit
                </p>
              )}
              {usagePercentage >= 100 && (
                <p className="text-red-600 text-sm mt-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Usage limit exceeded
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div>
                <p className="font-mono text-xs text-muted-fg">Videos Processed</p>
                <p className="font-bold">{currentPlan.videoCount}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-fg">Billing Cycle</p>
                <p className="font-bold">Monthly</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-fg">Next Reset</p>
                <p className="font-bold">{formatDate(currentPlan.nextBilling)}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="font-mono text-xs text-muted-fg mb-2">Account Email</p>
              <p className="font-mono text-sm">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" disabled>
              <CreditCard className="w-4 h-4 mr-2" />
              Update Payment Method
            </Button>
            <Button variant="outline" disabled>
              Cancel Subscription
            </Button>
          </div>

          {!user.stripeCustomerId && (
            <p className="text-sm text-muted-fg mt-4">
              Note: Payment processing is not yet enabled. All features are currently available for testing.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-bold uppercase mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.current ? 'border-4' : ''}
            >
              <CardContent className="p-6">
                {plan.current && (
                  <Badge className="mb-4">Current Plan</Badge>
                )}
                <h3 className="text-xl font-bold uppercase mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold mb-4">
                  ${plan.price}
                  <span className="text-sm font-normal">/mo</span>
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-mono text-sm">
                      {plan.minutes} minutes/month
                    </span>
                  </div>
                  {plan.models.map((model, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="font-mono text-sm">{model}</span>
                    </div>
                  ))}
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="font-mono text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  variant={plan.current ? 'secondary' : 'default'}
                  disabled={plan.current || !user.stripeCustomerId}
                >
                  {plan.current ? 'Current Plan' :
                   !user.stripeCustomerId ? 'Coming Soon' :
                   plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Video Processing</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-fg">
              <FileVideo className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No videos processed yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-4 font-bold uppercase text-sm">Date</th>
                    <th className="text-left p-4 font-bold uppercase text-sm">Video</th>
                    <th className="text-left p-4 font-bold uppercase text-sm">Duration</th>
                    <th className="text-left p-4 font-bold uppercase text-sm">Minutes Used</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((video: any) => (
                    <tr key={video.id} className="border-b border-border">
                      <td className="p-4 font-mono text-sm">
                        {formatDate(video.created_at)}
                      </td>
                      <td className="p-4 font-mono text-sm truncate max-w-[200px]" title={video.filename}>
                        {video.filename}
                      </td>
                      <td className="p-4 font-mono text-sm">
                        {video.duration_seconds ? formatDuration(video.duration_seconds) : '-'}
                      </td>
                      <td className="p-4 font-mono text-sm">
                        {video.duration_seconds ? formatMinutes(video.duration_seconds / 60) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe Integration Notice */}
      {!user.stripeCustomerId && (
        <Card className="mt-8 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-2">Payment Processing Coming Soon</h3>
                <p className="text-sm text-muted-fg">
                  Stripe integration is not yet active. You're currently on the free tier with all features
                  unlocked for testing. Payment processing will be enabled in a future update.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}