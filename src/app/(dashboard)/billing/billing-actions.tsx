'use client';

import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import * as autumn from '@/lib/autumn/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
  const { toast } = useToast();
  const router = useRouter();

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const result = await autumn.checkout({ productId });

      // Check if it was an instant purchase (user has saved payment method)
      if (result.data?.instant_purchase) {
        toast({
          title: "✓ Credits Purchased Successfully!",
          description: `${credits.toLocaleString()} credits have been added to your account.`,
          variant: "success" as any,
        });

        // Refresh the page data after a short delay to show the toast
        setTimeout(() => {
          router.refresh();
        }, 1500);
      }
      // If there's an error
      else if (result.error) {
        toast({
          title: "Purchase Failed",
          description: result.error.message || "Failed to purchase credits. Please try again.",
          variant: "destructive",
        });
      }
      // Otherwise, user will be redirected to Stripe checkout
    } catch (error) {
      console.error('Failed to start checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Only set loading to false if not redirecting
      if (!window.location.href.includes('checkout.stripe.com')) {
        setIsLoading(false);
      }
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
          Processing...
        </>
      ) : (
        `Purchase for $${price}`
      )}
    </Button>
  );
}

export function UpgradeButton({ planName, productId }: { planName: string; productId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const result = await autumn.checkout({ productId });

      if (result.error) {
        toast({
          title: "Upgrade Failed",
          description: result.error.message || "Failed to start upgrade. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to start upgrade:', error);
      toast({
        title: "Error",
        description: "Failed to start upgrade. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (!window.location.href.includes('checkout.stripe.com')) {
        setIsLoading(false);
      }
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
          Processing...
        </>
      ) : (
        `Upgrade to ${planName}`
      )}
    </Button>
  );
}