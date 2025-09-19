'use client';

import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import * as autumn from '@/lib/autumn/client';

export function BillingActions() {
  const [isLoading, setIsLoading] = useState(false);

  const handleBillingPortal = async () => {
    setIsLoading(true);
    try {
      await autumn.openBillingPortal();
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await autumn.cancel('spottr_pro');
      if (result.error) {
        alert(`Failed to cancel subscription: ${result.error.message}`);
      } else {
        alert('Subscription canceled successfully');
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={handleBillingPortal}
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        <CreditCard className="w-4 h-4 mr-2" />
        Manage Billing
      </Button>
      <Button
        variant="outline"
        onClick={handleCancelSubscription}
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Cancel Subscription
      </Button>
    </div>
  );
}

export function PurchaseCreditsButton({
  credits,
  price,
  productId
}: {
  credits: number;
  price: number;
  productId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      await autumn.checkout({ productId });
    } catch (error) {
      console.error('Failed to start checkout:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="w-full"
      onClick={handlePurchase}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        `Purchase for $${price}`
      )}
    </Button>
  );
}

export function UpgradeButton({ planName, productId }: { planName: string; productId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await autumn.checkout({ productId });
    } catch (error) {
      console.error('Failed to start upgrade:', error);
      alert('Failed to start upgrade. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      onClick={handleUpgrade}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        `Upgrade to ${planName}`
      )}
    </Button>
  );
}