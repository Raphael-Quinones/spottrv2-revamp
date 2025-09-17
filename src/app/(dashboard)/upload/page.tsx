'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileVideo, Settings2, AlertCircle, CheckCircle } from 'lucide-react';
import { getUserUsage } from '../actions';
import { formatMinutes } from '@/lib/utils';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [accuracy, setAccuracy] = useState('nano');
  const [frameInterval, setFrameInterval] = useState('0.5');
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch usage data
    getUserUsage().then(data => {
      setUsage(data);
      setLoading(false);
    });
  }, []);

  // Handle actual video upload
  const handleUpload = async () => {
    if (!selectedFile || !prompt) {
      alert('Please select a file and provide analysis instructions');
      return;
    }

    if (usage?.isExceeded) {
      alert('You have exceeded your monthly usage limit. Please upgrade your subscription.');
      return;
    }

    // Create form data
    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('prompt', prompt);
    formData.append('accuracy', accuracy);
    formData.append('frameInterval', frameInterval);

    try {
      setLoading(true);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Show success and redirect to video page
      alert('Video uploaded successfully! You can start processing from the video details page.');

      // Redirect to video detail page where they can trigger processing
      window.location.href = `/videos/${data.video.id}`;

    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Failed to upload video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid video file (MP4, AVI, MOV)');
        return;
      }
      setSelectedFile(file);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold uppercase mb-2">Upload Video</h1>
          <p className="font-mono text-sm text-muted-fg">Loading usage data...</p>
        </div>
      </div>
    );
  }

  const canUpload = !usage?.isExceeded;
  const usagePercentage = Number(usage?.percentageUsed) || 0;
  const minutesUsed = Number(usage?.minutesUsed) || 0;
  const minutesLimit = Number(usage?.minutesLimit) || 10;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Upload Video</h1>
        <p className="font-mono text-sm text-muted-fg">
          Upload a video for AI-powered analysis
        </p>
      </div>

      {/* Usage Warning */}
      {usage && (
        <Card className={`mb-8 ${usage.isExceeded ? 'border-red-500' : usagePercentage >= 80 ? 'border-yellow-500' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              {usage.isExceeded ? (
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              ) : usagePercentage >= 80 ? (
                <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3 className="font-bold mb-2">
                  {usage.isExceeded
                    ? 'Usage Limit Exceeded'
                    : usagePercentage >= 80
                    ? 'Approaching Usage Limit'
                    : 'Usage Status'}
                </h3>
                <p className="font-mono text-sm mb-3">
                  You've used {formatMinutes(usage.minutesUsed)} of {formatMinutes(usage.minutesLimit)} this month
                  ({Math.round(usagePercentage)}%)
                </p>
                <div className="h-2 bg-muted border border-border">
                  <div
                    className={`h-full transition-all ${
                      usage.isExceeded ? 'bg-red-500' :
                      usagePercentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                {usage.isExceeded && (
                  <p className="text-sm text-red-500 mt-3">
                    Please upgrade your subscription to continue uploading videos.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              accept="video/mp4,video/avi,video/quicktime,video/x-msvideo"
              onChange={handleFileSelect}
              disabled={!canUpload}
            />
            <label htmlFor="file-upload">
              <Button
                variant="secondary"
                className="brutal-shadow"
                disabled={!canUpload}
                onClick={(e) => {
                  if (!canUpload) e.preventDefault();
                }}
              >
                Select File
              </Button>
            </label>
            {selectedFile && (
              <div className="mt-6 p-4 bg-muted border-2 border-border">
                <div className="flex items-center space-x-2">
                  <FileVideo className="w-5 h-5" />
                  <span className="font-mono text-sm">{selectedFile.name}</span>
                  <span className="font-mono text-xs text-muted-fg">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}
            <p className="font-mono text-xs text-muted-fg mt-4">
              Supported formats: MP4, AVI, MOV
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2 className="w-5 h-5 mr-2" />
            Analysis Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="prompt">What should we analyze?</Label>
            <textarea
              id="prompt"
              className="w-full mt-2 p-4 border-4 border-border font-mono text-sm bg-bg resize-none"
              rows={4}
              placeholder="e.g., Identify all people and vehicles, track their movements, and note any text or signs visible in the video..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={!canUpload}
            />
            <p className="font-mono text-xs text-muted-fg mt-2">
              Be specific about what you want to find in the video
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="accuracy">Accuracy Level</Label>
              <select
                id="accuracy"
                className="w-full mt-2 p-3 border-4 border-border font-mono text-sm bg-bg"
                value={accuracy}
                onChange={(e) => setAccuracy(e.target.value)}
                disabled={!canUpload}
              >
                <option value="nano">GPT-5 Nano (Fast)</option>
                <option value="mini">GPT-5 Mini (Balanced)</option>
                <option value="full">GPT-5 (Most Accurate)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="interval">Frame Interval (seconds)</Label>
              <Input
                id="interval"
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                value={frameInterval}
                onChange={(e) => setFrameInterval(e.target.value)}
                className="mt-2 border-4"
                disabled={!canUpload}
              />
              <p className="font-mono text-xs text-muted-fg mt-2">
                Lower = more accurate, higher cost
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Button */}
      <Button
        className="w-full brutal-shadow text-lg py-6"
        onClick={handleUpload}
        disabled={!selectedFile || !prompt || !canUpload || loading}
      >
        {loading ? 'Uploading...' : !canUpload ? 'Usage Limit Exceeded' : 'Start Processing'}
      </Button>
    </div>
  );
}