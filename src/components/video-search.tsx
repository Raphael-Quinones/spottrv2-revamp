'use client';

import { useState } from 'react';
import { Search, Loader2, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDuration } from '@/lib/utils';

interface SearchRange {
  start: number;
  end: number;
  startFormatted: string;
  endFormatted: string;
  contexts: string[];
  frames: number[];
}

interface VideoSearchProps {
  videoId: string;
  onResultClick?: (timestamp: number) => void;
  onRangesUpdate?: (ranges: SearchRange[]) => void;
}

export default function VideoSearch({
  videoId,
  onResultClick,
  onRangesUpdate
}: VideoSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchRange[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId, query })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data = await response.json();
      setResults(data.ranges || []);
      setTotalMatches(data.totalMatches || 0);

      // Update parent component with ranges for timeline highlighting
      if (onRangesUpdate) {
        onRangesUpdate(data.ranges || []);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search video');
      setResults([]);
      setTotalMatches(0);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  const handleResultClick = (timestamp: number) => {
    if (onResultClick) {
      onResultClick(timestamp);
    }
  };

  return (
    <Card className="border-4 border-border">
      <CardHeader>
        <CardTitle className="text-xl uppercase">AI-Powered Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search: red cars on the right lane..."
            className="flex-1 border-2 border-border font-mono"
            disabled={loading}
          />
          <Button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="brutal-shadow"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 font-mono text-sm">
            {error}
          </div>
        )}

        {/* Results Summary */}
        {hasSearched && !loading && !error && (
          <div className="font-mono text-sm text-muted-fg">
            {totalMatches > 0 ? (
              <>Found {totalMatches} matches in {results.length} time ranges</>
            ) : (
              <>No matches found for "{query}"</>
            )}
          </div>
        )}

        {/* Search Results */}
        {results.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((range, index) => (
              <div
                key={`${range.start}-${range.end}`}
                className="group p-3 border-2 border-border bg-muted hover:bg-background cursor-pointer transition-colors"
                onClick={() => handleResultClick(range.start)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-fg" />
                    <span className="font-mono font-bold">
                      {range.startFormatted} - {range.endFormatted}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-fg group-hover:text-foreground transition-colors" />
                </div>
                <div className="font-mono text-xs text-muted-fg">
                  {range.contexts.length > 1 ? (
                    <ul className="space-y-1">
                      {range.contexts.slice(0, 3).map((context, idx) => (
                        <li key={idx}>• {context}</li>
                      ))}
                      {range.contexts.length > 3 && (
                        <li className="text-muted-fg/50">
                          + {range.contexts.length - 3} more...
                        </li>
                      )}
                    </ul>
                  ) : (
                    range.contexts[0]
                  )}
                </div>
                <div className="mt-1 font-mono text-xs text-muted-fg/50">
                  Frames: {range.frames.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Example Queries */}
        {!hasSearched && (
          <div className="pt-4 border-t-2 border-border">
            <p className="font-mono text-xs text-muted-fg mb-2">Example searches:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'red cars on the right lane',
                'people crossing the street',
                'yellow vehicles',
                'stop signs',
                'cars turning left'
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="px-2 py-1 text-xs font-mono border-2 border-border hover:bg-muted transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}