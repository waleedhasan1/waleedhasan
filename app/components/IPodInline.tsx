'use client'

import { useState, useRef, useEffect } from 'react';

export default function IPodInline() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ 
      height: '100%', 
      background: '#008080',
      padding: 32,
      fontFamily: 'MS Sans Serif, Arial, sans-serif',
      fontSize: 11,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* MP3 Player Body */}
      <div style={{
        background: '#2C2C2C',
        border: '3px solid #1A1A1A',
        borderRadius: 8,
        padding: 16,
        width: 320,
        boxShadow: '0 8px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}>
        {/* Brand/Logo */}
        <div style={{
          textAlign: 'center',
          color: '#00FF00',
          fontSize: 10,
          fontWeight: 'bold',
          marginBottom: 8,
          letterSpacing: 2
        }}>
          ♪ WALEED MP3 PLAYER ♪
        </div>

        {/* LCD Screen */}
        <div style={{
          background: '#7AA86E',
          border: '3px inset #4A6B3E',
          borderRadius: 4,
          padding: 12,
          marginBottom: 16,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
          minHeight: 100,
          fontFamily: 'Courier New, monospace'
        }}>
          {/* Title */}
          <div style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: '#000',
            marginBottom: 8,
            textAlign: 'center',
            borderBottom: '1px solid #000',
            paddingBottom: 4
          }}>
            ♫ NOW PLAYING ♫
          </div>

          {/* Song Info */}
          <div style={{
            fontSize: 10,
            color: '#000',
            marginBottom: 8,
            textAlign: 'center'
          }}>
            My Song.mp3
          </div>

          {/* Progress Bar */}
          <div style={{
            background: '#4A6B3E',
            border: '1px solid #000',
            height: 12,
            marginBottom: 6,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              background: '#000',
              height: '100%',
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              transition: 'width 0.1s'
            }} />
          </div>

          {/* Time Display */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 9,
            color: '#000',
            fontWeight: 'bold'
          }}>
            <span>{formatTime(currentTime)}</span>
            <span>{isPlaying ? '▶' : '■'}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8,
          marginBottom: 12
        }}>
          {/* Previous/Rewind */}
          <button
            onClick={() => handleSeek(Math.max(currentTime - 10, 0))}
            style={{
              background: '#C0C0C0',
              border: '2px outset #DFDFDF',
              padding: '12px 8px',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold',
              borderRadius: 4
            }}
            onMouseDown={(e) => e.currentTarget.style.border = '2px inset #DFDFDF'}
            onMouseUp={(e) => e.currentTarget.style.border = '2px outset #DFDFDF'}
          >
            ⏮
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            style={{
              background: '#00AA00',
              border: '2px outset #00DD00',
              padding: '12px 8px',
              cursor: 'pointer',
              fontSize: 20,
              fontWeight: 'bold',
              borderRadius: 4,
              color: '#FFF'
            }}
            onMouseDown={(e) => e.currentTarget.style.border = '2px inset #00DD00'}
            onMouseUp={(e) => e.currentTarget.style.border = '2px outset #00DD00'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          {/* Next/Forward */}
          <button
            onClick={() => handleSeek(Math.min(currentTime + 10, duration))}
            style={{
              background: '#C0C0C0',
              border: '2px outset #DFDFDF',
              padding: '12px 8px',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold',
              borderRadius: 4
            }}
            onMouseDown={(e) => e.currentTarget.style.border = '2px inset #DFDFDF'}
            onMouseUp={(e) => e.currentTarget.style.border = '2px outset #DFDFDF'}
          >
            ⏭
          </button>
        </div>

        {/* Volume Control */}
        <div style={{
          background: '#1A1A1A',
          border: '2px inset #000',
          padding: 10,
          borderRadius: 4
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6
          }}>
            <span style={{ color: '#00FF00', fontWeight: 'bold', fontSize: 10 }}>VOL:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ 
              color: '#00FF00', 
              fontWeight: 'bold', 
              fontSize: 10,
              fontFamily: 'Courier New, monospace',
              minWidth: 35
            }}>
              {volume}%
            </span>
          </div>
          
          {/* Volume Bars */}
          <div style={{ display: 'flex', gap: 2, height: 8 }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: i < (volume / 5) ? '#00FF00' : '#003300',
                  border: '1px solid #000'
                }}
              />
            ))}
          </div>
        </div>

        {/* Status LEDs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 12
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: isPlaying ? '#00FF00' : '#003300',
              border: '2px solid #000',
              margin: '0 auto 4px',
              boxShadow: isPlaying ? '0 0 8px #00FF00' : 'none'
            }} />
            <span style={{ fontSize: 8, color: '#AAA' }}>PLAY</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#FF0000',
              border: '2px solid #000',
              margin: '0 auto 4px',
              boxShadow: '0 0 8px #FF0000'
            }} />
            <span style={{ fontSize: 8, color: '#AAA' }}>POWER</span>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} src="/dejavurodrigoshoegaze.mp3" />
      </div>
    </div>
  );
}