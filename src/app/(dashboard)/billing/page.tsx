'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Check, 
  X,
  TrendingUp,
  Calendar,
  Download,
  AlertCircle,
  Zap,
  Clock,
  BarChart3
} from 'lucide-react';

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState('pro');

  // Mock data
  const currentPlan = {
    name: 'Pro',
    price: 29,
    billingCycle: 'monthly',
    nextBilling: '2024-02-15',
    minutesUsed: 75,
    minutesTotal: 100,
    videosProcessed: 23,
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      minutes: 10,
      features: [
        'GPT-5 Nano only',
        'Basic support',
        '720p video quality',
        '7-day data retention',
      ],
      notIncluded: [
        'GPT-5 Mini & Full',
        'Priority processing',
        'API access',
        'Custom frame intervals',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      minutes: 100,
      popular: true,
      features: [
        'All AI models',
        'Priority support',
        '1080p video quality',
        '30-day data retention',
        'API access',
        'Custom frame intervals',
      ],
      notIncluded: [
        'Unlimited processing',
        'Dedicated support',
        'Custom AI models',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      minutes: 'Unlimited',
      features: [
        'All AI models',
        'Dedicated support',
        '4K video quality',
        'Unlimited retention',
        'API access',
        'Custom frame intervals',
        'Custom AI models',
        'SLA guarantee',
      ],
      notIncluded: [],
    },
  ];

  const usageHistory = [
    { month: 'January', minutes: 75, videos: 23, cost: 29 },
    { month: 'December', minutes: 62, videos: 18, cost: 29 },
    { month: 'November', minutes: 89, videos: 31, cost: 29 },
    { month: 'October', minutes: 45, videos: 15, cost: 29 },
  ];

  const invoices = [
    { id: 'INV-2024-001', date: '2024-01-15', amount: 29, status: 'paid' },
    { id: 'INV-2023-012', date: '2023-12-15', amount: 29, status: 'paid' },
    { id: 'INV-2023-011', date: '2023-11-15', amount: 29, status: 'paid' },
    { id: 'INV-2023-010', date: '2023-10-15', amount: 29, status: 'paid' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Billing</h1>
        <p className="font-mono text-sm text-gray-600">
          Manage your subscription and usage
        </p>
      </div>

      {/* Current Plan & Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your subscription details and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-2xl font-bold">{currentPlan.name} Plan</h3>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="font-mono text-sm text-gray-600 mt-1">
                  ${currentPlan.price}/month • Renews {currentPlan.nextBilling}
                </p>
              </div>
              <Button variant="outline">Change Plan</Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="font-mono text-sm">Minutes Used</span>
                  <span className="font-bold">
                    {currentPlan.minutesUsed} / {currentPlan.minutesTotal}
                  </span>
                </div>
                <Progress value={(currentPlan.minutesUsed / currentPlan.minutesTotal) * 100} />
                <p className="font-mono text-xs text-gray-600 mt-1">
                  {currentPlan.minutesTotal - currentPlan.minutesUsed} minutes remaining
                </p>
              </div>

              <div className="pt-4 border-t-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-mono text-xs uppercase text-gray-600">Videos Processed</p>
                    <p className="text-2xl font-bold">{currentPlan.videosProcessed}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs uppercase text-gray-600">Avg. Length</p>
                    <p className="text-2xl font-bold">3.2 min</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Usage Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border-2 border-yellow-600">
                <p className="font-bold text-sm mb-1">75% Usage Warning</p>
                <p className="font-mono text-xs">
                  You've used 75% of your monthly minutes
                </p>
              </div>
              <Button className="w-full shadow-brutal">
                <Zap className="w-4 h-4 mr-2" />
                Add More Minutes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border-2 p-6 ${
                  plan.popular ? 'border-4 border-black' : 'border-black'
                } ${selectedPlan === plan.id ? 'bg-black text-white' : ''}`}
              >
                {plan.popular && (
                  <Badge variant="secondary" className="mb-2">
                    Most Popular
                  </Badge>
                )}
                <h3 className="text-xl font-bold uppercase mb-2">{plan.name}</h3>
                <div className="mb-4">
                  {typeof plan.price === 'number' ? (
                    <>
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="font-mono text-sm">/month</span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold">{plan.price}</span>
                  )}
                </div>
                <p className="font-mono text-sm mb-4">
                  {typeof plan.minutes === 'number' ? `${plan.minutes} minutes/month` : plan.minutes}
                </p>
                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start">
                      <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((feature, idx) => (
                    <div key={idx} className="flex items-start opacity-50">
                      <X className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant={selectedPlan === plan.id ? 'secondary' : 'outline'}
                  className="w-full"
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {currentPlan.name.toLowerCase() === plan.name.toLowerCase()
                    ? 'Current Plan'
                    : plan.id === 'enterprise'
                    ? 'Contact Sales'
                    : 'Select Plan'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Usage History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usageHistory.map((month) => (
                <div key={month.month} className="flex items-center justify-between p-3 border-2 border-black">
                  <div>
                    <p className="font-bold">{month.month}</p>
                    <p className="font-mono text-xs text-gray-600">
                      {month.videos} videos • {month.minutes} minutes
                    </p>
                  </div>
                  <span className="font-bold">${month.cost}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border-2 border-black">
                  <div>
                    <p className="font-mono text-sm">{invoice.id}</p>
                    <p className="font-mono text-xs text-gray-600">{invoice.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="success">Paid</Badge>
                    <span className="font-bold">${invoice.amount}</span>
                    <Button size="icon" variant="ghost">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Invoices
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Manage your payment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border-2 border-black">
            <div className="flex items-center space-x-4">
              <CreditCard className="w-8 h-8" />
              <div>
                <p className="font-mono">•••• •••• •••• 4242</p>
                <p className="font-mono text-xs text-gray-600">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline">Update</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}