'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileVideo, Settings2 } from 'lucide-react';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [accuracy, setAccuracy] = useState('nano');
  const [frameInterval, setFrameInterval] = useState('0.5');

  // Mock upload handler - no actual functionality
  const handleUpload = () => {
    alert('This is a mockup - no actual upload functionality');
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Upload Video</h1>
        <p className="font-mono text-sm text-muted-fg">
          Upload a video for AI-powered analysis
        </p>
      </div>

      {/* Upload Area */}
      <Card className="mb-8">
        <CardContent className="p-12">
          <div className="border-4 border-dashed border-border p-12 text-center">
            <Upload className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-xl font-bold uppercase mb-2">Drop Video Here</h3>
            <p className="font-mono text-sm text-muted-fg mb-4">
              or click to browse
            </p>
            <input 
              type="file" 
              className="hidden" 
              id="file-upload"
              onChange={(e) => setSelectedFile(e.target.files?.[0]?.name || '')}
            />
            <label htmlFor="file-upload">
              <Button variant="secondary" className="brutal-shadow">
                Select File
              </Button>
            </label>
            {selectedFile && (
              <div className="mt-4 p-4 border-2 border-border bg-muted">
                <FileVideo className="inline w-5 h-5 mr-2" />
                <span className="font-mono text-sm">{selectedFile}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Analysis Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="prompt">What to Analyze</Label>
              <textarea
                id="prompt"
                className="w-full mt-2 p-3 border-2 border-border bg-bg font-mono text-sm resize-none focus:outline-none focus:border-4 transition-all"
                rows={4}
                placeholder="e.g., Analyze everything, Focus on vehicles and people, Track all text and signs..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="mt-2 font-mono text-xs text-muted-fg">
                AI will catalog everything it finds. You can search for specific items later when viewing the video.
              </p>
            </div>
            
            <div>
              <Label htmlFor="accuracy">Accuracy Level</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="accuracy"
                    value="nano"
                    checked={accuracy === 'nano'}
                    onChange={(e) => setAccuracy(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-mono text-sm">GPT-5 Nano (Fast)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="accuracy"
                    value="mini"
                    checked={accuracy === 'mini'}
                    onChange={(e) => setAccuracy(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-mono text-sm">GPT-5 Mini (Balanced)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="accuracy"
                    value="full"
                    checked={accuracy === 'full'}
                    onChange={(e) => setAccuracy(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-mono text-sm">GPT-5 Full (Accurate)</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processing Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <p className="mt-2 font-mono text-xs text-muted-fg">
                Lower values = more accurate but slower
              </p>
            </div>

            <div className="pt-4">
              <h4 className="font-bold uppercase text-sm mb-2">Estimated Usage</h4>
              <div className="space-y-1">
                <p className="font-mono text-xs">
                  Frames: ~{Math.floor(120 / parseFloat(frameInterval || '0.5'))}
                </p>
                <p className="font-mono text-xs">
                  Processing time: ~5 minutes
                </p>
                <p className="font-mono text-xs">
                  Cost: 2.5 minutes from quota
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          size="lg" 
          className="brutal-shadow"
          onClick={handleUpload}
        >
          Start Processing
        </Button>
      </div>
    </div>
  );
}