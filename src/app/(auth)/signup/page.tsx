'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock signup - no actual account creation
    alert('This is a mockup - no actual signup functionality');
  };

  return (
    <>
      <h1 className="text-3xl font-bold uppercase mb-2">Create Account</h1>
      <p className="font-mono text-sm text-muted-fg mb-8">
        Start analyzing videos with AI
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-2"
          />
        </div>

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
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-2"
          />
        </div>

        <div className="space-y-4">
          <Button type="submit" className="w-full brutal-shadow">
            Create Account
          </Button>
          
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