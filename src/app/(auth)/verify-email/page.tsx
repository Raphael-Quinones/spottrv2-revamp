'use client';

import Link from 'next/link';
import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get('email');
    if (email) {
      setUserEmail(email);
      // Store in localStorage for persistence
      localStorage.setItem('pendingVerificationEmail', email);
    } else {
      // Try to get from localStorage if not in URL
      const storedEmail = localStorage.getItem('pendingVerificationEmail');
      if (storedEmail) {
        setUserEmail(storedEmail);
      }
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!userEmail) return;

    setIsResending(true);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: userEmail,
    });

    if (!error) {
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    }

    setIsResending(false);
  };

  return (
    <>
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-fg text-bg">
          <Mail className="w-12 h-12" />
        </div>
      </div>

      <h1 className="text-3xl font-bold uppercase mb-2 text-center">
        Check Your Email
      </h1>

      <p className="font-mono text-sm text-muted-fg mb-8 text-center">
        We've sent you a verification link
      </p>

      <div className="space-y-6">
        <div className="border-2 border-border p-6 bg-muted/5">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div className="space-y-2">
              <p className="font-mono text-sm">
                We've sent a verification email to:
              </p>
              {userEmail && (
                <p className="font-mono text-sm font-bold break-all">
                  {userEmail}
                </p>
              )}
              <p className="font-mono text-xs text-muted-fg">
                Click the link in the email to verify your account and get started.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="font-mono text-xs text-center text-muted-fg">
            Didn't receive the email? Check your spam folder or
          </p>

          <Button
            onClick={handleResendEmail}
            disabled={isResending || resent}
            variant="outline"
            className="w-full"
          >
            {resent ? 'Email Sent!' : isResending ? 'Sending...' : 'Resend Verification Email'}
          </Button>

          {resent && (
            <p className="font-mono text-xs text-center text-green-600 dark:text-green-400">
              Verification email has been resent successfully!
            </p>
          )}
        </div>

        <div className="pt-6 border-t-2 border-border">
          <p className="font-mono text-xs text-center text-muted-fg mb-4">
            Already verified your email?
          </p>
          <Link href="/login">
            <Button className="w-full brutal-shadow">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}