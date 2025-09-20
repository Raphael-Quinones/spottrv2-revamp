import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, TrendingUp, Calendar, Check, AlertCircle, FileVideo, Coins, Plus, Minus } from 'lucide-react';
import { getBillingData } from '../actions';
import { formatDate, formatDuration, formatRelativeTime } from '@/lib/utils';
import { BillingActions, PurchaseCreditsButton, UpgradeButton } from './billing-actions';

export default async function BillingPage() {
  // Fetch real billing data
  const billingData = await getBillingData();
  const { currentPlan, user } = billingData;

  // Calculate usage percentage
  const usagePercentage = currentPlan.creditsPurchased > 0
    ? Math.min((currentPlan.creditsUsed / currentPlan.creditsPurchased) * 100, 100)
    : 0;

  // Additional credit packages with Autumn product IDs
  const creditPackages = [
    { credits: 10000, price: 10, productId: 'credits_10k' },
    { credits: 50000, price: 45, productId: 'credits_50k' },
    { credits: 100000, price: 80, productId: 'credits_100k' },
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
                <span className="font-mono text-sm">Credits Used This Month</span>
                <span className="font-mono text-sm font-bold">
                  {currentPlan.creditsUsed.toLocaleString()} / {currentPlan.creditsPurchased.toLocaleString()}
                </span>
              </div>
              <Progress value={usagePercentage} />
              <div className="mt-2">
                <p className="text-sm">
                  <strong>{currentPlan.creditsBalance.toLocaleString()}</strong> credits remaining
                </p>
                <p className="text-xs text-muted-fg mt-1">
                  {currentPlan.formattedCredits}
                </p>
              </div>
              {usagePercentage >= 80 && usagePercentage < 100 && (
                <p className="text-yellow-600 text-sm mt-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Low on credits - consider purchasing more
                </p>
              )}
              {usagePercentage >= 100 && (
                <p className="text-red-600 text-sm mt-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Credits exhausted - purchase more to continue
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

          <BillingActions />

        </CardContent>
      </Card>

      {/* Subscription Plan */}
      <div className="mb-8">
        <h2 className="text-xl font-bold uppercase mb-4">Subscription Plan</h2>
        <Card className={currentPlan.tier === 'pro' ? 'border-4 border-green-500' : 'border-4'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge className={currentPlan.tier === 'pro' ? 'bg-green-500' : ''}>Current Plan</Badge>
              {currentPlan.tier === 'pro' && (
                <Badge
                  className="text-white font-bold"
                  style={{
                    background: 'linear-gradient(90deg, #ff0000 0%, #ff7f00 14%, #ffff00 28%, #00ff00 42%, #0000ff 56%, #4b0082 70%, #9400d3 84%, #ff0000 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'rainbow-shift 4s linear infinite',
                    textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0 1px 0 #000, 1px 0 0 #000, 0 -1px 0 #000, -1px 0 0 #000'
                  }}
                >
                  PRO MEMBER
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-bold uppercase mb-2">{currentPlan.name}</h3>
            <p className="text-3xl font-bold mb-4">
              ${currentPlan.price}
              <span className="text-sm font-normal">/mo</span>
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span className="font-mono text-sm">
                  {currentPlan.tier === 'pro' ? '40,000' : currentPlan.tier === 'enterprise' ? 'Unlimited' : '1,000'} credits monthly
                </span>
              </div>
              {currentPlan.tier === 'pro' && (
                <>
                  <div className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-mono text-sm">Advanced search capabilities</span>
                  </div>
                  <div className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-mono text-sm">Custom frame intervals</span>
                  </div>
                  <div className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-mono text-sm">Priority processing</span>
                  </div>
                  <div className="flex items-start">
                    <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-mono text-sm">Email support</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade to Pro if user is on free tier */}
      {currentPlan.tier !== 'pro' && currentPlan.tier !== 'enterprise' && (
        <div className="mb-8">
          <h2 className="text-xl font-bold uppercase mb-4">Upgrade Your Plan</h2>
          <Card className="border-4 border-green-500">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold uppercase mb-2">Pro Plan</h3>
              <p className="text-3xl font-bold mb-4">
                $29<span className="text-sm font-normal">/mo</span>
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="font-mono text-sm">40,000 credits monthly</span>
                </div>
              </div>
              <UpgradeButton planName="Pro" productId="spottr_pro" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Credits */}
      <div className="mb-8">
        <h2 className="text-xl font-bold uppercase mb-4">Purchase Additional Credits</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {creditPackages.map((pkg) => (
            <Card key={pkg.credits}>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <Coins className="w-12 h-12 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">
                    {pkg.credits.toLocaleString()}
                  </h3>
                  <p className="font-mono text-sm text-muted-fg">credits</p>
                </div>
                <p className="text-xl font-bold text-center mb-2">
                  ${pkg.price}
                </p>
                <PurchaseCreditsButton
                  credits={pkg.credits}
                  price={pkg.price}
                  productId={pkg.productId}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Credit Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {billingData.recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-fg">
              <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-4 font-bold uppercase text-sm">Date</th>
                    <th className="text-left p-4 font-bold uppercase text-sm">Type</th>
                    <th className="text-left p-4 font-bold uppercase text-sm">Description</th>
                    <th className="text-right p-4 font-bold uppercase text-sm">Credits</th>
                    <th className="text-right p-4 font-bold uppercase text-sm">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {billingData.recentTransactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-border">
                      <td className="p-4 font-mono text-sm">
                        {formatRelativeTime(tx.created_at)}
                      </td>
                      <td className="p-4">
                        <Badge variant={tx.credits_amount > 0 ? 'success' : 'secondary'}>
                          {tx.transaction_type.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-sm truncate max-w-[300px]" title={tx.description}>
                        {tx.description || '-'}
                      </td>
                      <td className="p-4 font-mono text-sm text-right">
                        <span className={tx.credits_amount > 0 ? 'text-green-600' : 'text-red-600'}>
                          {tx.credits_amount > 0 ? (
                            <Plus className="w-3 h-3 inline mr-1" />
                          ) : (
                            <Minus className="w-3 h-3 inline mr-1" />
                          )}
                          {Math.abs(tx.credits_amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-sm text-right">
                        {tx.balance_after.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}