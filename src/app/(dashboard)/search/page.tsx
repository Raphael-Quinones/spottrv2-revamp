'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Play, Clock, FileVideo } from 'lucide-react';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock search results - no actual search functionality
  const mockResults = [
    {
      id: 1,
      videoName: 'traffic_cam_001.mp4',
      timestamp: '00:45',
      confidence: 95,
      preview: 'License plate detected: ABC-123',
      date: '2024-01-15',
    },
    {
      id: 2,
      videoName: 'traffic_cam_001.mp4',
      timestamp: '01:23',
      confidence: 87,
      preview: 'License plate detected: XYZ-789',
      date: '2024-01-15',
    },
    {
      id: 3,
      videoName: 'dashcam_highway.mp4',
      timestamp: '02:10',
      confidence: 92,
      preview: 'Stop sign identified at intersection',
      date: '2024-01-13',
    },
    {
      id: 4,
      videoName: 'parking_lot.mp4',
      timestamp: '03:45',
      confidence: 78,
      preview: 'Red SUV entering parking area',
      date: '2024-01-11',
    },
  ];

  const recentSearches = [
    'red vehicles',
    'license plates',
    'people wearing hats',
    'delivery trucks',
    'stop signs',
  ];

  const handleSearch = () => {
    alert('This is a mockup - no actual search functionality');
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Search</h1>
        <p className="font-mono text-sm text-muted-fg">
          Search across all your analyzed videos
        </p>
      </div>

      {/* Search Input */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-fg" />
              <Input
                placeholder="Describe what you're looking for..."
                className="pl-10 h-14 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="lg" className="brutal-shadow" onClick={handleSearch}>
              Search
            </Button>
          </div>
          
          {/* Recent Searches */}
          <div className="mt-6">
            <p className="font-mono text-xs uppercase text-muted-fg mb-3">Recent Searches</p>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => setSearchQuery(search)}
                  className="px-3 py-1 border-2 border-border bg-bg hover:bg-fg hover:text-bg transition-colors font-mono text-sm"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <div className="grid gap-4">
        <h2 className="text-xl font-bold uppercase">Results</h2>
        
        {mockResults.map((result) => (
          <Card key={result.id} className="brutal-shadow-hover">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileVideo className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold uppercase text-sm">{result.videoName}</h3>
                    <p className="font-mono text-xs text-muted-fg">{result.date}</p>
                  </div>
                </div>
                <Badge variant={result.confidence > 90 ? 'success' : 'warning'}>
                  {result.confidence}% Match
                </Badge>
              </div>
              
              <p className="font-mono text-sm mb-4">{result.preview}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-fg">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-xs">Timestamp: {result.timestamp}</span>
                </div>
                <Button variant="secondary" size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  View Clip
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}