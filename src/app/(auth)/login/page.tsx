'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - no actual authentication
    alert('This is a mockup - no actual login functionality');
  };

  return (
    <>
      <h1 className="text-3xl font-bold uppercase mb-2">Welcome Back</h1>
      <p className="font-mono text-sm text-muted-fg mb-8">
        Sign in to continue to your dashboard
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <Button type="submit" className="w-full brutal-shadow">
          Sign In
        </Button>
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