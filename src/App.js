import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing, Volume2, VolumeX, Crown } from 'lucide-react';

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isChiming, setIsChiming] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastChimeTime, setLastChimeTime] = useState(null);

  // Simple Web Audio API chime (no external dependencies)
  const playSimpleChime = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Westminster chimes frequencies
      const notes = [659.25, 523.25, 587.33, 392.00]; // E5, C5, D5, G4
      
      notes.forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'triangle';
        
        // Envelope for bell-like sound
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + 0.1 + index * 0.8);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 2 + index * 0.8);
        
        oscillator.start(audioContext.currentTime + index * 0.8);
        oscillator.stop(audioContext.currentTime + 2 + index * 0.8);
      });
    } catch (error) {
      console.log('Audio playback failed:', error);
    }
  }, []);

  const triggerChime = useCallback(async () => {
    setIsChiming(true);
    
    if (soundEnabled) {
      try {
        // Try to play audio file first
        const audio = new Audio('/assets/sounds/grandfather-clock-chime.mp3');
        audio.volume = 0.7;
        
        try {
          await audio.play();
        } catch (audioError) {
          // If audio file fails, use simple Web Audio API
          console.log('Audio file not found, using simple chimes');
          playSimpleChime();
        }
      } catch (error) {
        console.log('Audio playback failed:', error);
      }
    }

    // Stop chiming animation after 6 seconds
    setTimeout(() => {
      setIsChiming(false);
    }, 6000);
  }, [soundEnabled, playSimpleChime]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check for chime times (6am, noon, and midnight)
  useEffect(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    
    // Check if it's exactly 6am (06:00), noon (12:00), or midnight (00:00)
    if ((hours === 6 || hours === 12 || hours === 0) && minutes === 0 && seconds === 0) {
      const currentChimeTime = `${hours}:${minutes}:${seconds}`;
      
      // Only chime if we haven't chimed for this exact time yet
      if (lastChimeTime !== currentChimeTime) {
        triggerChime();
        setLastChimeTime(currentChimeTime);
      }
    }
  }, [currentTime, lastChimeTime, triggerChime]);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isChimeTime = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hours === 6 || hours === 12 || hours === 0) && minutes === 0;
  };

  const getTimeUntilNextChime = () => {
    const now = new Date();
    const hours = now.getHours();
    
    let nextChime;
    if (hours < 6) {
      // Next chime is 6am today
      nextChime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
    } else if (hours < 12) {
      // Next chime is noon today
      nextChime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    } else {
      // Next chime is midnight tomorrow
      nextChime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    }
    
    const diff = nextChime - now;
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hoursLeft}h ${minutesLeft}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-red-900 to-amber-800 flex items-center justify-center p-4" 
         style={{
           backgroundImage: `
             radial-gradient(circle at 25% 25%, rgba(218, 165, 32, 0.1) 0%, transparent 50%),
             radial-gradient(circle at 75% 75%, rgba(139, 69, 19, 0.1) 0%, transparent 50%)
           `
         }}>
      
      {/* Ornate background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative bg-gradient-to-b from-amber-50 to-cream-100 rounded-3xl p-8 shadow-2xl border-4 border-yellow-600 max-w-md w-full"
           style={{
             background: 'linear-gradient(145deg, #fefce8, #fef3c7, #fed7aa)',
             boxShadow: `
               0 25px 50px -12px rgba(0, 0, 0, 0.4),
               inset 0 1px 0 rgba(255, 255, 255, 0.6),
               0 0 0 1px rgba(184, 134, 11, 0.3)
             `
           }}>
        
        {/* Ornate corner decorations */}
        <div className="absolute top-2 left-2 w-8 h-8 border-l-4 border-t-4 border-yellow-600 opacity-40"></div>
        <div className="absolute top-2 right-2 w-8 h-8 border-r-4 border-t-4 border-yellow-600 opacity-40"></div>
        <div className="absolute bottom-2 left-2 w-8 h-8 border-l-4 border-b-4 border-yellow-600 opacity-40"></div>
        <div className="absolute bottom-2 right-2 w-8 h-8 border-r-4 border-b-4 border-yellow-600 opacity-40"></div>

        {/* Header with aristocratic styling */}
        <div className="text-center mb-8 relative">
          <Crown className="w-8 h-8 text-yellow-700 mx-auto mb-3" />
          <h1 className="text-2xl font-serif font-bold text-amber-900 mb-2 tracking-wide">
            The Count's Timepiece
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mb-2"></div>
          <p className="text-amber-700 text-sm italic font-serif">
            "Time marks the rhythm of a gentleman's day" — Hotel Metropol
          </p>
        </div>

        {/* Main Clock Display with Roman numerals inspiration */}
        <div className="text-center mb-8 relative">
          <div className="text-5xl font-serif font-bold text-amber-900 mb-2 tracking-wider drop-shadow-sm">
            {formatTime(currentTime)}
          </div>
          <div className="text-amber-800 text-lg font-serif">
            {formatDate(currentTime)}
          </div>
          
          {/* Decorative line */}
          <div className="mt-4 mx-auto w-32 h-px bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600"></div>
        </div>

        {/* Chime Status with aristocratic flair */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-500 border-2 font-serif ${
            isChiming 
              ? 'bg-yellow-200 text-amber-900 border-yellow-500 shadow-lg animate-pulse' 
              : isChimeTime()
                ? 'bg-green-100 text-green-800 border-green-400 shadow-md'
                : 'bg-amber-50 text-amber-700 border-amber-300'
          }`}>
            {isChiming ? (
              <>
                <BellRing className="w-6 h-6 animate-bounce" />
                <span className="font-medium text-lg">The Clock Chimes!</span>
              </>
            ) : isChimeTime() ? (
              <>
                <Bell className="w-6 h-6" />
                <span className="font-medium">À l'heure précise</span>
              </>
            ) : (
              <>
                <Bell className="w-6 h-6" />
                <span>Next chime in {getTimeUntilNextChime()}</span>
              </>
            )}
          </div>
        </div>

        {/* Elegant Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-serif transition-all duration-300 border-2 shadow-md ${
              soundEnabled 
                ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100' 
                : 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="text-sm font-medium">
              {soundEnabled ? 'Sonorous' : 'Silenced'}
            </span>
          </button>

          <button
            onClick={triggerChime}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-50 text-purple-800 border-2 border-purple-300 hover:bg-purple-100 transition-all duration-300 font-serif shadow-md"
          >
            <Bell className="w-5 h-5" />
            <span className="text-sm font-medium">Test Chime</span>
          </button>
        </div>



        {/* Signature flourish */}
        <div className="mt-4 text-center">
          <div className="text-xs text-amber-600 font-serif italic">
            ~ A gentleman's companion to the passage of time ~
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
