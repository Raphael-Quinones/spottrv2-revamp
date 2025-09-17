'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface SearchRange {
  start: number;
  end: number;
  startFormatted: string;
  endFormatted: string;
  contexts: string[];
  frames: number[];
}

interface VideoPlayerEnhancedProps {
  videoUrl: string;
  searchRanges?: SearchRange[];
  jumpToTimestamp?: number | null;
  onJumpComplete?: () => void;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export default function VideoPlayerEnhanced({
  videoUrl,
  searchRanges = [],
  jumpToTimestamp,
  onJumpComplete,
  onTimeUpdate,
  className = ''
}: VideoPlayerEnhancedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTime, setTooltipTime] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeHighlight, setActiveHighlight] = useState<SearchRange | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setCurrentTime(video.currentTime);

        // Check if we're in a highlighted range
        const currentRange = searchRanges.find(
          range => video.currentTime >= range.start && video.currentTime <= range.end
        );

        // Debug: Log when entering/leaving a highlight
        if (currentRange && !activeHighlight) {
          console.log(`🎯 VIDEO: Entered highlight range at ${video.currentTime.toFixed(1)}s`);
          console.log(`  Range: ${currentRange.start}s - ${currentRange.end}s`);
        } else if (!currentRange && activeHighlight) {
          console.log(`🎯 VIDEO: Left highlight range at ${video.currentTime.toFixed(1)}s`);
        }

        setActiveHighlight(currentRange || null);

        if (onTimeUpdate) {
          onTimeUpdate(video.currentTime);
        }
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [isDragging, onTimeUpdate, searchRanges]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false);
      });
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Define callback functions before useEffect that uses them
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
  }, [isMuted]);

  const adjustVolume = useCallback((delta: number) => {
    if (!videoRef.current) return;
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    videoRef.current.volume = newVolume;
  }, [volume]);

  const skip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  }, [currentTime, duration]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      // Don't trigger shortcuts if user is typing in an input, textarea, or select
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.contentEditable === 'true') {
        return;
      }

      // Don't trigger shortcuts if any modifier keys are pressed (Ctrl, Alt, Shift, Meta)
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      switch(e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, skip, adjustVolume, toggleMute, toggleFullscreen]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleProgressDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !videoRef.current || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    setCurrentTime(newTime);
    if (!isPlaying) {
      videoRef.current.currentTime = newTime;
    }
  }, [isDragging, duration, isPlaying]);

  const handleProgressMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleProgressMouseUp = useCallback(() => {
    if (isDragging && videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
    setIsDragging(false);
  }, [isDragging, currentTime]);

  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    setTooltipTime(time);
    setTooltipPosition(x);
    setShowTooltip(true);

    // Check if hovering over a highlight
    const hoverRange = searchRanges.find(
      range => time >= range.start && time <= range.end
    );

    if (hoverRange) {
      e.currentTarget.style.cursor = 'pointer';
    } else {
      e.currentTarget.style.cursor = 'default';
    }
  }, [duration, searchRanges]);

  const jumpToTime = useCallback((timestamp: number) => {
    if (!videoRef.current) return;

    console.log(`\n⏩ VIDEO: Jumping to timestamp ${timestamp}s`);
    const minutes = Math.floor(timestamp / 60);
    const seconds = timestamp % 60;
    console.log(`  Formatted: ${minutes}:${seconds.toFixed(1)}`);
    console.log(`  Video duration: ${videoRef.current.duration}s`);

    videoRef.current.currentTime = timestamp;
    setCurrentTime(timestamp);

    if (!isPlaying) {
      console.log('  Auto-playing video...');
      videoRef.current.play();
    }
  }, [isPlaying]);

  // Handle external jump to timestamp requests
  useEffect(() => {
    if (jumpToTimestamp !== null && jumpToTimestamp !== undefined && videoRef.current) {
      console.log(`\n⏭️ VIDEO: Received external jump request to ${jumpToTimestamp}s`);

      // Make sure video is loaded first
      if (videoRef.current.readyState >= 2) {
        jumpToTime(jumpToTimestamp);
        if (onJumpComplete) {
          onJumpComplete();
        }
      } else {
        // Wait for video to be ready
        const handleCanPlay = () => {
          console.log('  Video ready, jumping now...');
          jumpToTime(jumpToTimestamp);
          if (onJumpComplete) {
            onJumpComplete();
          }
          videoRef.current?.removeEventListener('canplay', handleCanPlay);
        };
        videoRef.current.addEventListener('canplay', handleCanPlay);
      }
    }
  }, [jumpToTimestamp, onJumpComplete, jumpToTime]);

  const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !volumeSliderRef.current) return;

    const rect = volumeSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;

    videoRef.current.volume = percentage;
    setVolume(percentage);
    if (percentage > 0 && isMuted) {
      videoRef.current.muted = false;
    }
  }, [isMuted]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Find tooltip content if hovering over a highlight
  const getTooltipContent = () => {
    if (!showTooltip) return null;

    const hoverRange = searchRanges.find(
      range => tooltipTime >= range.start && tooltipTime <= range.end
    );

    if (hoverRange) {
      return (
        <div className="text-center">
          <div className="font-bold">{formatDuration(tooltipTime)}</div>
          <div className="text-xs text-yellow-300 mt-1">{hoverRange.contexts[0]}</div>
        </div>
      );
    }

    return formatDuration(tooltipTime);
  };

  return (
    <div
      ref={containerRef}
      className={`relative bg-black overflow-hidden group ${className}`}
      onMouseUp={handleProgressMouseUp}
      onMouseMove={handleProgressDrag}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Active Highlight Indicator */}
      {activeHighlight && (
        <div className="absolute top-4 left-4 bg-yellow-500/90 text-black px-3 py-1 rounded font-mono text-sm">
          Match: {activeHighlight.contexts[0]}
        </div>
      )}

      {/* Custom Controls Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Center Play Button */}
        {!isPlaying && showControls && (
          <button
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </button>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress Bar with Highlights */}
          <div
            ref={progressBarRef}
            className="relative h-1 group/progress cursor-pointer hover:h-2 transition-all"
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            onMouseMove={handleProgressHover}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {/* Background */}
            <div className="absolute inset-0 bg-white/20 rounded-full overflow-hidden">
              {/* Buffered Progress */}
              <div
                className="absolute top-0 left-0 h-full bg-white/30"
                style={{ width: `${buffered}%` }}
              />
            </div>

            {/* Search Range Highlights */}
            {searchRanges.map((range, index) => {
              const startPercent = (range.start / duration) * 100;
              const widthPercent = ((range.end - range.start) / duration) * 100;

              return (
                <div
                  key={`${range.start}-${range.end}-${index}`}
                  className="absolute top-0 h-full bg-yellow-400 opacity-60 hover:opacity-80 transition-opacity rounded-full"
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    jumpToTime(range.start);
                  }}
                />
              );
            })}

            {/* Current Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />

            {/* Scrubber Handle */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${progressPercentage}%` }}
            />

            {/* Hover Tooltip */}
            {showTooltip && (
              <div
                className="absolute -top-12 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap"
                style={{ left: tooltipPosition }}
              >
                {getTooltipContent()}
              </div>
            )}
          </div>

          {/* Control Buttons Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" fill="white" />
                )}
              </button>

              {/* Skip Back */}
              <button
                onClick={() => skip(-10)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Skip back 10 seconds"
              >
                <SkipBack className="w-4 h-4 text-white" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Skip forward 10 seconds"
              >
                <SkipForward className="w-4 h-4 text-white" />
              </button>

              {/* Volume Controls */}
              <div className="flex items-center space-x-1 group/volume">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>

                {/* Volume Slider */}
                <div
                  ref={volumeSliderRef}
                  className="w-0 group-hover/volume:w-20 overflow-hidden transition-all duration-200"
                >
                  <div
                    className="relative h-1 bg-white/30 rounded-full cursor-pointer"
                    onClick={handleVolumeChange}
                  >
                    <div
                      className="absolute top-0 left-0 h-full bg-white rounded-full"
                      style={{ width: `${volume * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Time Display */}
              <div className="text-white text-sm font-mono ml-2">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Search Matches Indicator */}
              {searchRanges.length > 0 && (
                <div className="text-yellow-400 text-xs font-mono px-2 py-1 bg-yellow-400/10 rounded">
                  {searchRanges.length} matches
                </div>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5 text-white" />
                ) : (
                  <Maximize className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help (shown on hover) */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-black/80 text-white/60 text-xs p-2 rounded space-y-1 font-mono">
          <div>Space/K: Play/Pause</div>
          <div>← →: Skip 10s</div>
          <div>↑ ↓: Volume</div>
          <div>M: Mute</div>
          <div>F: Fullscreen</div>
        </div>
      </div>
    </div>
  );
}