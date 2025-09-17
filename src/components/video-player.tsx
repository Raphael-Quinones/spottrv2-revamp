'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface SearchRange {
  start: number;
  end: number;
  startFormatted: string;
  endFormatted: string;
  contexts: string[];
  frames: number[];
}

interface VideoPlayerProps {
  videoUrl: string;
  searchRanges?: SearchRange[];
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export default function VideoPlayer({
  videoUrl,
  searchRanges = [],
  onTimeUpdate,
  className = ''
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTime, setTooltipTime] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;

    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    setTooltipTime(time);
    setTooltipPosition(x);
    setShowTooltip(true);
  };

  const handleProgressLeave = () => {
    setShowTooltip(false);
  };

  const jumpToTime = (timestamp: number) => {
    if (!videoRef.current) return;

    videoRef.current.currentTime = timestamp;
    setCurrentTime(timestamp);

    // Auto-play when jumping to timestamp
    videoRef.current.play();
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`relative bg-black border-4 border-border ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full"
        onClick={togglePlay}
      />

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-4 space-y-3">
        {/* Progress Bar with Search Highlights */}
        <div
          ref={progressBarRef}
          className="relative h-3 bg-muted border-2 border-border cursor-pointer group"
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
        >
          {/* Current Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-white"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Search Range Highlights */}
          {searchRanges.map((range, index) => {
            const startPercent = (range.start / duration) * 100;
            const widthPercent = ((range.end - range.start) / duration) * 100;

            return (
              <div
                key={`${range.start}-${range.end}`}
                className="absolute top-0 h-full bg-yellow-400/50 border-x-2 border-yellow-600 cursor-pointer hover:bg-yellow-400/70 transition-colors"
                style={{
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  jumpToTime(range.start);
                }}
                title={`${range.startFormatted} - ${range.endFormatted}: ${range.contexts[0]}`}
              />
            );
          })}

          {/* Hover Tooltip */}
          {showTooltip && (
            <div
              className="absolute -top-8 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded font-mono"
              style={{ left: tooltipPosition }}
            >
              {formatDuration(tooltipTime)}
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Time Display */}
            <div className="font-mono text-white text-sm">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search Matches Indicator */}
            {searchRanges.length > 0 && (
              <div className="font-mono text-yellow-400 text-xs">
                {searchRanges.length} matches
              </div>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Search Range Labels (optional - shown on hover) */}
      {searchRanges.length > 0 && (
        <div className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded font-mono text-xs">
          <div className="mb-1 font-bold">Search Matches:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {searchRanges.map((range) => (
              <button
                key={`${range.start}-${range.end}`}
                onClick={() => jumpToTime(range.start)}
                className="block w-full text-left hover:text-yellow-400 transition-colors"
              >
                {range.startFormatted} - {range.endFormatted}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}