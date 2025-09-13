'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Bell, 
  Shield, 
  Key,
  Eye,
  EyeOff,
  Save,
  Mail,
  Smartphone,
  Monitor,
  Volume2,
  Zap
} from 'lucide-react';

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp',
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    desktop: true,
    sound: true,
    processingComplete: true,
    processingFailed: true,
    usageAlerts: true,
  });
  const [advanced, setAdvanced] = useState({
    frameInterval: '0.5',
    maxTokens: '350000',
    autoRetry: true,
    debugMode: false,
  });

  const handleSave = (section: string) => {
    // TODO: Implement save logic
    console.log(`Saving ${section}:`, { profile, notifications, advanced });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Settings</h1>
        <p className="font-mono text-sm text-gray-600">
          Manage your account and application preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Account Type</Label>
                <div className="mt-2">
                  <Badge variant="default" className="text-sm py-2 px-3">
                    PRO ACCOUNT
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('profile')} className="shadow-brutal">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you want to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notification Channels */}
                <div className="space-y-3">
                  <h3 className="font-bold uppercase text-sm mb-3">Channels</h3>
                  <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 mr-3" />
                      <span className="font-mono text-sm">Email</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center">
                      <Smartphone className="w-5 h-5 mr-3" />
                      <span className="font-mono text-sm">Push</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.push}
                      onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center">
                      <Monitor className="w-5 h-5 mr-3" />
                      <span className="font-mono text-sm">Desktop</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.desktop}
                      onChange={(e) => setNotifications({ ...notifications, desktop: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center">
                      <Volume2 className="w-5 h-5 mr-3" />
                      <span className="font-mono text-sm">Sound</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.sound}
                      onChange={(e) => setNotifications({ ...notifications, sound: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </label>
                </div>

                {/* Notification Types */}
                <div className="space-y-3">
                  <h3 className="font-bold uppercase text-sm mb-3">Events</h3>
                  <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                    <span className="font-mono text-sm">Processing Complete</span>
                    <input
                      type="checkbox"
                      checked={notifications.processingComplete}
                      onChange={(e) => setNotifications({ ...notifications, processingComplete: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                    <span className="font-mono text-sm">Processing Failed</span>
                    <input
                      type="checkbox"
                      checked={notifications.processingFailed}
                      onChange={(e) => setNotifications({ ...notifications, processingFailed: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                    <span className="font-mono text-sm">Usage Alerts</span>
                    <input
                      type="checkbox"
                      checked={notifications.usageAlerts}
                      onChange={(e) => setNotifications({ ...notifications, usageAlerts: e.target.checked })}
                      className="w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('notifications')} className="shadow-brutal">
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Manage your API keys and integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiKey">OpenAI API Key</Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value="sk-...AbCd"
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="font-mono text-xs text-gray-600 mt-2">
                Your API key is encrypted and stored securely
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Advanced Settings
            </CardTitle>
            <CardDescription>
              Fine-tune processing parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frameInterval">Default Frame Interval (seconds)</Label>
                <Input
                  id="frameInterval"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={advanced.frameInterval}
                  onChange={(e) => setAdvanced({ ...advanced, frameInterval: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="maxTokens">Max Tokens per Request</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={advanced.maxTokens}
                  onChange={(e) => setAdvanced({ ...advanced, maxTokens: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                <div>
                  <span className="font-mono text-sm">Auto-Retry Failed Processing</span>
                  <p className="font-mono text-xs text-gray-600 mt-1">
                    Automatically retry failed video processing
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={advanced.autoRetry}
                  onChange={(e) => setAdvanced({ ...advanced, autoRetry: e.target.checked })}
                  className="w-4 h-4"
                />
              </label>
              <label className="flex items-center justify-between p-3 border-2 border-black cursor-pointer hover:bg-gray-50">
                <div>
                  <span className="font-mono text-sm">Debug Mode</span>
                  <p className="font-mono text-xs text-gray-600 mt-1">
                    Show detailed processing logs
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={advanced.debugMode}
                  onChange={(e) => setAdvanced({ ...advanced, debugMode: e.target.checked })}
                  className="w-4 h-4"
                />
              </label>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleSave('advanced')} className="shadow-brutal">
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-600">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Shield className="w-5 h-5 mr-2" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border-2 border-red-600">
              <div>
                <p className="font-bold">Delete All Videos</p>
                <p className="font-mono text-xs text-gray-600 mt-1">
                  Permanently delete all videos and analysis data
                </p>
              </div>
              <Button variant="destructive">
                Delete All
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border-2 border-red-600">
              <div>
                <p className="font-bold">Delete Account</p>
                <p className="font-mono text-xs text-gray-600 mt-1">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}