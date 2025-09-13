'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, Settings, Info } from 'lucide-react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [searchPrompt, setSearchPrompt] = useState('');
  const [accuracyLevel, setAccuracyLevel] = useState<'nano' | 'mini' | 'full'>('nano');
  const [frameInterval, setFrameInterval] = useState('0.5');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement upload logic
    console.log('Upload:', { file, searchPrompt, accuracyLevel, frameInterval });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Upload Video</h1>
        <p className="font-mono text-sm text-gray-600">
          Upload a video and tell us what you're looking for
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* File Upload */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div
              className="border-4 border-dashed border-black p-12 text-center"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {!file ? (
                <>
                  <Upload className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-xl font-bold uppercase mb-2">Drop Video Here</h3>
                  <p className="font-mono text-sm text-gray-600 mb-4">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button type="button" variant="secondary" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <File className="w-12 h-12" />
                    <div className="text-left">
                      <p className="font-bold">{file.name}</p>
                      <p className="font-mono text-sm text-gray-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search Prompt */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What are you looking for?</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="prompt">Search Prompt</Label>
            <textarea
              id="prompt"
              className="w-full h-24 px-4 py-3 mt-2 font-mono text-sm border-2 border-black focus:outline-none focus:border-4 transition-all"
              placeholder="e.g., Find all license plates, identify people wearing red shirts, locate delivery trucks..."
              value={searchPrompt}
              onChange={(e) => setSearchPrompt(e.target.value)}
              required
            />
            <p className="font-mono text-xs text-gray-600 mt-2">
              Be specific about what you want to find in the video
            </p>
          </CardContent>
        </Card>

        {/* Accuracy Level */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Accuracy Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                className={`p-6 border-2 border-black text-left transition-all ${
                  accuracyLevel === 'nano' ? 'bg-black text-white' : 'hover:bg-gray-100'
                }`}
                onClick={() => setAccuracyLevel('nano')}
              >
                <h4 className="font-bold uppercase mb-1">Nano</h4>
                <p className="font-mono text-xs mb-2">Fast & Basic</p>
                <Badge variant={accuracyLevel === 'nano' ? 'secondary' : 'outline'}>
                  Free Tier
                </Badge>
              </button>

              <button
                type="button"
                className={`p-6 border-2 border-black text-left transition-all ${
                  accuracyLevel === 'mini' ? 'bg-black text-white' : 'hover:bg-gray-100'
                }`}
                onClick={() => setAccuracyLevel('mini')}
              >
                <h4 className="font-bold uppercase mb-1">Mini</h4>
                <p className="font-mono text-xs mb-2">Balanced</p>
                <Badge variant={accuracyLevel === 'mini' ? 'secondary' : 'outline'}>
                  Pro
                </Badge>
              </button>

              <button
                type="button"
                className={`p-6 border-2 border-black text-left transition-all ${
                  accuracyLevel === 'full' ? 'bg-black text-white' : 'hover:bg-gray-100'
                }`}
                onClick={() => setAccuracyLevel('full')}
              >
                <h4 className="font-bold uppercase mb-1">Full</h4>
                <p className="font-mono text-xs mb-2">Most Accurate</p>
                <Badge variant={accuracyLevel === 'full' ? 'secondary' : 'outline'}>
                  Pro
                </Badge>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="mb-6">
          <CardHeader>
            <button
              type="button"
              className="flex items-center justify-between w-full"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Advanced Settings
              </CardTitle>
              <span className="font-mono text-sm">
                {showAdvanced ? '−' : '+'}
              </span>
            </button>
          </CardHeader>
          {showAdvanced && (
            <CardContent>
              <div>
                <Label htmlFor="interval">Frame Interval (seconds)</Label>
                <Input
                  id="interval"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  value={frameInterval}
                  onChange={(e) => setFrameInterval(e.target.value)}
                  className="mt-2"
                />
                <p className="font-mono text-xs text-gray-600 mt-2">
                  How often to extract frames for analysis (default: 0.5s)
                </p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Submit Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-gray-600" />
            <p className="font-mono text-xs text-gray-600">
              Processing will use approximately {file ? Math.ceil((file.size / 1024 / 1024) * 0.1) : 0} minutes
            </p>
          </div>
          <Button 
            type="submit" 
            size="lg" 
            className="shadow-brutal"
            disabled={!file || !searchPrompt}
          >
            Start Processing
          </Button>
        </div>
      </form>
    </div>
  );
}