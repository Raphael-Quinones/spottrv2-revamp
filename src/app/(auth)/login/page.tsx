'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '../actions';
import { useState, useEffect, Suspense } from 'react';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full brutal-shadow" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign In'}
    </Button>
  );
}

function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if user just verified their email
    if (searchParams.get('verified') === 'true') {
      setShowVerifiedMessage(true);
      // Remove the query param after showing the message
      window.history.replaceState({}, '', '/login');
      setTimeout(() => setShowVerifiedMessage(false), 5000);
    }
  }, [searchParams]);

  async function handleSignIn(formData: FormData) {
    setError(null);
    const result = await signIn(formData);
    if (result?.error) {
      // Check if it's an email verification error
      if (result.error.includes('Email not confirmed')) {
        setError('Please verify your email before signing in. Check your inbox for the verification link.');
      } else {
        setError(result.error);
      }
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold uppercase mb-2">Welcome Back</h1>
      <p className="font-mono text-sm text-muted-fg mb-8">
        Sign in to continue to your dashboard
      </p>

      {showVerifiedMessage && (
        <div className="border-2 border-green-500 bg-green-50 dark:bg-green-950 p-3 mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-mono text-green-600 dark:text-green-400">
              Email verified successfully! You can now sign in.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="border-2 border-red-500 bg-red-50 dark:bg-red-950 p-3 mb-4">
          <p className="text-sm font-mono text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form action={handleSignIn} className="space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="mt-2"
          />
        </div>

        <div className="flex items-center justify-between">
          <Link 
            href="/forgot-password" 
            className="font-mono text-xs uppercase hover:bg-fg hover:text-bg px-2 py-1 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <SubmitButton />
      </form>

      <div className="mt-8 pt-8 border-t-2 border-border text-center">
        <p className="font-mono text-sm">
          Don't have an account?{' '}
          <Link 
            href="/signup" 
            className="font-bold uppercase hover:bg-fg hover:text-bg px-2 py-1 transition-colors"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}