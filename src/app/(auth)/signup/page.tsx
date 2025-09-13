'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement signup logic
    console.log('Signup:', { email, password, confirmPassword });
  };

  return (
    <>
      <h1 className="text-3xl font-bold uppercase mb-2">Get Started</h1>
      <p className="font-mono text-sm text-gray-600 mb-8">
        Create your account to start analyzing videos
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

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-2"
          />
        </div>

        <Button type="submit" className="w-full shadow-brutal">
          Create Account
        </Button>
      </form>

      <div className="mt-8 pt-8 border-t-2 border-black text-center">
        <p className="font-mono text-sm">
          Already have an account?{' '}
          <Link 
            href="/login" 
            className="font-bold uppercase hover:bg-black hover:text-white px-2 py-1 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
}