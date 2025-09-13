'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Search as SearchIcon, 
  Filter,
  Video,
  Clock,
  Calendar,
  Play,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [accuracyFilter, setAccuracyFilter] = useState<string[]>([]);

  // Mock search results
  const searchResults = [
    {
      videoId: '1',
      videoName: 'traffic_cam_001.mp4',
      matches: [
        { timestamp: 12, text: 'License plate ABC-123 detected', confidence: 0.95 },
        { timestamp: 45, text: 'License plate XYZ-789 detected', confidence: 0.88 },
      ],
      totalMatches: 4,
      videoDuration: '2:34',
      processedAt: '2024-01-15',
    },
    {
      videoId: '2',
      videoName: 'parking_lot.mp4',
      matches: [
        { timestamp: 78, text: 'License plate DEF-456 in parking spot', confidence: 0.92 },
        { timestamp: 120, text: 'Multiple plates visible', confidence: 0.76 },
      ],
      totalMatches: 7,
      videoDuration: '10:05',
      processedAt: '2024-01-14',
    },
    {
      videoId: '3',
      videoName: 'highway_footage.mp4',
      matches: [
        { timestamp: 5, text: 'License plate GHI-789 speeding', confidence: 0.84 },
      ],
      totalMatches: 1,
      videoDuration: '5:30',
      processedAt: '2024-01-13',
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search logic
    console.log('Searching for:', searchQuery);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold uppercase mb-2">Search</h1>
        <p className="font-mono text-sm text-gray-600">
          Find specific moments across all your processed videos
        </p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={handleSearch}>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
                <Input
                  type="text"
                  placeholder="Search for license plates, people, objects, or any specific moments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button 
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="h-12 w-12"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
              <Button type="submit" size="lg" className="shadow-brutal">
                Search
              </Button>
            </div>
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t-2 border-black">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Video Selection */}
                <div>
                  <Label className="mb-3 block">Select Videos</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 border-2 border-black" />
                      <span className="font-mono text-sm">All Videos</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 border-2 border-black" />
                      <span className="font-mono text-sm">traffic_cam_001.mp4</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 border-2 border-black" />
                      <span className="font-mono text-sm">parking_lot.mp4</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 border-2 border-black" />
                      <span className="font-mono text-sm">highway_footage.mp4</span>
                    </label>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <Label className="mb-3 block">Date Range</Label>
                  <div className="space-y-2">
                    <Input 
                      type="date" 
                      placeholder="From"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    />
                    <Input 
                      type="date" 
                      placeholder="To"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    />
                  </div>
                </div>

                {/* Accuracy Level */}
                <div>
                  <Label className="mb-3 block">Accuracy Level</Label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 border-2 border-black" />
                      <span className="font-mono text-sm">Nano</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 border-2 border-black" />
                      <span className="font-mono text-sm">Mini</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 border-2 border-black" />
                      <span className="font-mono text-sm">Full</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchQuery && searchResults.length > 0 && (
        <>
          <div className="mb-4">
            <p className="font-mono text-sm">
              Found <span className="font-bold">{searchResults.reduce((acc, r) => acc + r.totalMatches, 0)} matches</span> across <span className="font-bold">{searchResults.length} videos</span>
            </p>
          </div>

          <div className="space-y-4">
            {searchResults.map((result) => (
              <Card key={result.videoId} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <Video className="w-5 h-5 mr-2" />
                        {result.videoName}
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-2 font-mono text-xs text-gray-600">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {result.videoDuration}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {result.processedAt}
                        </span>
                      </div>
                    </div>
                    <Badge>{result.totalMatches} matches</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {result.matches.map((match, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between p-3 border-2 border-gray-300 hover:border-black transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="font-mono">
                            {formatTime(match.timestamp)}
                          </Badge>
                          <p className="text-sm">{match.text}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs text-gray-600">
                            {Math.round(match.confidence * 100)}% confidence
                          </span>
                          <Play className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href={`/videos/${result.videoId}`}>
                    <Button variant="outline" className="w-full">
                      View All Matches in Video
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {searchQuery && searchResults.length === 0 && (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={SearchIcon}
              title="No Results Found"
              description="Try adjusting your search query or filters"
              action={{
                label: 'Clear Search',
                onClick: () => setSearchQuery('')
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!searchQuery && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="border-4 border-black p-6 inline-block mb-6">
                <SearchIcon className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold uppercase mb-2">Start Searching</h3>
              <p className="font-mono text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Enter a search query to find specific moments across all your processed videos
              </p>
              <div className="space-y-2 max-w-md mx-auto text-left">
                <p className="font-mono text-xs uppercase text-gray-600">Example searches:</p>
                <div className="space-y-1">
                  <button 
                    className="w-full text-left p-2 border border-gray-300 hover:border-black transition-colors font-mono text-sm"
                    onClick={() => setSearchQuery('license plate ABC-123')}
                  >
                    "license plate ABC-123"
                  </button>
                  <button 
                    className="w-full text-left p-2 border border-gray-300 hover:border-black transition-colors font-mono text-sm"
                    onClick={() => setSearchQuery('red car')}
                  >
                    "red car"
                  </button>
                  <button 
                    className="w-full text-left p-2 border border-gray-300 hover:border-black transition-colors font-mono text-sm"
                    onClick={() => setSearchQuery('person wearing hat')}
                  >
                    "person wearing hat"
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}