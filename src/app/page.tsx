import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Zap, Shield, Video } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Quick Theme Toggle in corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="border-b-4 border-border">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-bold uppercase tracking-tighter mb-6">
              Find Anything<br />
              <span className="bg-fg text-bg px-4">In Your Videos</span>
            </h1>
            <p className="text-xl font-mono mb-8 text-muted-fg">
              AI-powered video analysis that spots what matters
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="brutal-shadow">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="brutal-shadow">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold uppercase text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="brutal-shadow">
              <CardContent className="p-8">
                <div className="border-2 border-border p-4 inline-block mb-4">
                  <Video className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold uppercase mb-2">Upload</h3>
                <p className="font-mono text-sm">
                  Drop your video file and tell us what you're looking for
                </p>
              </CardContent>
            </Card>

            <Card className="brutal-shadow">
              <CardContent className="p-8">
                <div className="border-2 border-border p-4 inline-block mb-4">
                  <Zap className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold uppercase mb-2">Process</h3>
                <p className="font-mono text-sm">
                  AI analyzes every frame to find what you need
                </p>
              </CardContent>
            </Card>

            <Card className="brutal-shadow">
              <CardContent className="p-8">
                <div className="border-2 border-border p-4 inline-block mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold uppercase mb-2">Search</h3>
                <p className="font-mono text-sm">
                  Find exact moments with natural language queries
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 border-t-4 border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold uppercase text-center mb-16">
            Simple Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-border">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold uppercase mb-2">Free</h3>
                <p className="text-4xl font-bold mb-4">$0</p>
                <p className="font-mono text-sm mb-6">Perfect for trying out</p>
                <ul className="space-y-2 font-mono text-sm mb-8">
                  <li>• 1,000 credits/month</li>
                  <li>• GPT-5 Nano</li>
                  <li>• Basic support</li>
                </ul>
                <Button variant="outline" className="w-full">
                  Start Free
                </Button>
              </CardContent>
            </Card>

            <Card className="border-4 border-border brutal-shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold uppercase mb-2">Pro</h3>
                <p className="text-4xl font-bold mb-4">$29</p>
                <p className="font-mono text-sm mb-6">For professionals</p>
                <ul className="space-y-2 font-mono text-sm mb-8">
                  <li>• 40,000 credits/month</li>
                  <li>• All AI models</li>
                  <li>• Priority support</li>
                </ul>
                <Button className="w-full brutal-shadow">
                  Get Pro
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-border">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold uppercase mb-2">Enterprise</h3>
                <p className="text-4xl font-bold mb-4">Custom</p>
                <p className="font-mono text-sm mb-6">For teams</p>
                <ul className="space-y-2 font-mono text-sm mb-8">
                  <li>• Unlimited credits</li>
                  <li>• All AI models</li>
                  <li>• Dedicated support</li>
                </ul>
                <Button variant="outline" className="w-full">
                  Contact Us
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="font-mono text-sm uppercase text-muted-fg">
            © 2024 Spottr. AI-Powered Video Analysis.
          </p>
        </div>
      </footer>
    </div>
  );
}