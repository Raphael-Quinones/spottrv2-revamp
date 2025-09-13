import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, TrendingUp, Calendar, Check } from 'lucide-react';

export default function BillingPage() {
  // Mock billing data - no actual payment functionality
  const currentPlan = {
    name: 'Pro',
    price: 29,
    minutesUsed: 75,
    minutesTotal: 100,
    billingCycle: 'Monthly',
    nextBilling: '2024-02-15',
  };

  const plans = [
    {
      name: 'Free',
      price: 0,
      minutes: 10,
      models: ['GPT-5 Nano'],
      features: ['Basic support', 'Standard processing'],
      current: false,
    },
    {
      name: 'Pro',
      price: 29,
      minutes: 100,
      models: ['All AI models'],
      features: ['Priority support', 'Fast processing', 'API access'],
      current: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      minutes: 'Unlimited',
      models: ['All AI models'],
      features: ['Dedicated support', 'Custom integration', 'SLA guarantee'],
      current: false,
    },
  ];

  const invoices = [
    { id: 1, date: '2024-01-15', amount: 29, status: 'paid' },
    { id: 2, date: '2023-12-15', amount: 29, status: 'paid' },
    { id: 3, date: '2023-11-15', amount: 29, status: 'paid' },
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
                ${currentPlan.price}/month
              </p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="font-mono text-sm">Minutes Used</span>
                <span className="font-mono text-sm font-bold">
                  {currentPlan.minutesUsed} / {currentPlan.minutesTotal}
                </span>
              </div>
              <Progress value={(currentPlan.minutesUsed / currentPlan.minutesTotal) * 100} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <p className="font-mono text-xs text-muted-fg">Billing Cycle</p>
                <p className="font-bold">{currentPlan.billingCycle}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-fg">Next Billing Date</p>
                <p className="font-bold">{currentPlan.nextBilling}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button variant="outline">Change Plan</Button>
            <Button variant="outline">Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-bold uppercase mb-4">Available Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
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
                  {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                  {typeof plan.price === 'number' && (
                    <span className="text-sm font-normal">/mo</span>
                  )}
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    <span className="font-mono text-sm">
                      {plan.minutes} {typeof plan.minutes === 'number' && 'minutes/month'}
                    </span>
                  </div>
                  {plan.models.map((model, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      <span className="font-mono text-sm">{model}</span>
                    </div>
                  ))}
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      <span className="font-mono text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full" 
                  variant={plan.current ? 'secondary' : 'default'}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-4 font-bold uppercase text-sm">Date</th>
                  <th className="text-left p-4 font-bold uppercase text-sm">Amount</th>
                  <th className="text-left p-4 font-bold uppercase text-sm">Status</th>
                  <th className="text-left p-4 font-bold uppercase text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border">
                    <td className="p-4 font-mono text-sm">{invoice.date}</td>
                    <td className="p-4 font-mono text-sm">${invoice.amount}</td>
                    <td className="p-4">
                      <Badge variant="success">Paid</Badge>
                    </td>
                    <td className="p-4">
                      <Button size="sm" variant="outline">
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}