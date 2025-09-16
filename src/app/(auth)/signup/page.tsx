'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '../actions';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full brutal-shadow" disabled={pending}>
      {pending ? 'Creating account...' : 'Create Account'}
    </Button>
  );
}

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp(formData: FormData) {
    setError(null);

    // Check passwords match
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold uppercase mb-2">Create Account</h1>
      <p className="font-mono text-sm text-muted-fg mb-8">
        Start analyzing videos with AI
      </p>

      {error && (
        <div className="border-2 border-red-500 bg-red-50 dark:bg-red-950 p-3 mb-4">
          <p className="text-sm font-mono text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form action={handleSignUp} className="space-y-6">
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
            minLength={6}
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            name="confirm-password"
            type="password"
            placeholder="••••••••"
            minLength={6}
            required
            className="mt-2"
          />
        </div>

        <div className="space-y-4">
          <SubmitButton />
          
          <p className="font-mono text-xs text-center text-muted-fg">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </form>

      <div className="mt-8 pt-8 border-t-2 border-border text-center">
        <p className="font-mono text-sm">
          Already have an account?{' '}
          <Link 
            href="/login" 
            className="font-bold uppercase hover:bg-fg hover:text-bg px-2 py-1 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
}