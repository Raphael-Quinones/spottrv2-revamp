'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Key, Bell, Video, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [notifications, setNotifications] = useState(true);
  const [autoProcess, setAutoProcess] = useState(false);
  const [defaultInterval, setDefaultInterval] = useState('0.5');
  const [defaultAccuracy, setDefaultAccuracy] = useState('nano');

  const handleSave = () => {
    alert('This is a mockup - settings are not saved');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Settings</h1>
        <p className="font-mono text-sm text-muted-fg">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button onClick={handleSave}>Update Profile</Button>
          </CardContent>
        </Card>

        {/* Processing Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Processing Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="interval">Default Frame Interval (seconds)</Label>
              <Input
                id="interval"
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={defaultInterval}
                onChange={(e) => setDefaultInterval(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Default Accuracy Level</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="defaultAccuracy"
                    value="nano"
                    checked={defaultAccuracy === 'nano'}
                    onChange={(e) => setDefaultAccuracy(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-mono text-sm">GPT-5 Nano (Fast)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="defaultAccuracy"
                    value="mini"
                    checked={defaultAccuracy === 'mini'}
                    onChange={(e) => setDefaultAccuracy(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-mono text-sm">GPT-5 Mini (Balanced)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="defaultAccuracy"
                    value="full"
                    checked={defaultAccuracy === 'full'}
                    onChange={(e) => setDefaultAccuracy(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-mono text-sm">GPT-5 Full (Accurate)</span>
                </label>
              </div>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoProcess}
                  onChange={(e) => setAutoProcess(e.target.checked)}
                  className="mr-3"
                />
                <span className="font-mono text-sm">Auto-process uploads</span>
              </label>
            </div>
            <Button onClick={handleSave}>Save Preferences</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="mr-3"
                />
                <span className="font-mono text-sm">Email notifications when processing completes</span>
              </label>
            </div>
            <Button onClick={handleSave}>Update Notifications</Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                className="mt-2"
              />
            </div>
            <Button onClick={handleSave}>Change Password</Button>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="api-key">OpenAI API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                className="mt-2"
              />
              <p className="mt-2 font-mono text-xs text-muted-fg">
                Optional: Use your own API key for processing
              </p>
            </div>
            <Button onClick={handleSave}>Update API Key</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}