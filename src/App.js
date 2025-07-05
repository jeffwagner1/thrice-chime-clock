import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing, Volume2, VolumeX, Crown } from 'lucide-react';

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isChiming, setIsChiming] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastChimeTime, setLastChimeTime] = useState(null);
  const [ambientAudio, setAmbientAudio] = useState(null);
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Get background style based on time of day - Option 1: Subtle & Elegant
  const getTimeBasedBackground = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 4 && hour < 7) {
      // Dawn: Soft champagne and pearl tones
      return {
        background: 'linear-gradient(135deg, #f7f1e3 0%, #e8dcc0 30%, #d4c4a8 60%, #b8a082 100%)',
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(255, 245, 220, 0.3) 0%, transparent 60%),
          radial-gradient(circle at 75% 75%, rgba(245, 222, 179, 0.2) 0%, transparent 50%)`
      };
    } else if (hour >= 7 && hour < 12) {
      // Morning: Fresh cream and soft blue
      return {
        background: 'linear-gradient(135deg, #f0f4f8 0%, #e6f3ff 40%, #d1ecf1 70%, #b8dbd9 100%)',
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(230, 243, 255, 0.3) 0%, transparent 60%)`
      };
    } else if (hour >= 12 && hour < 18) {
      // Afternoon: Warm ivory and pale gold
      return {
        background: 'linear-gradient(135deg, #faf7f2 0%, #f5f0e8 30%, #ede4d3 60%, #e0d3bb 100%)',
        backgroundImage: `
          radial-gradient(circle at 30% 40%, rgba(255, 250, 240, 0.5) 0%, transparent 40%),
          radial-gradient(circle at 70% 60%, rgba(245, 240, 232, 0.3) 0%, transparent 50%)`
      };
    } else if (hour >= 18 && hour < 21) {
      // Evening: Rich burgundy and amber (like fine wine)
      return {
        background: 'linear-gradient(135deg, #f4e6d7 0%, #e8c5a0 30%, #d4a574 60%, #b8865a 100%)',
        backgroundImage: `
          radial-gradient(circle at 20% 60%, rgba(212, 165, 116, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 30%, rgba(244, 230, 215, 0.4) 0%, transparent 60%)`
      };
    } else {
      // Night: Deep navy and silver (like moonlight on marble)
      return {
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 30%, #4a6741 60%, #5d6d5b 100%)',
        backgroundImage: `
          radial-gradient(circle at 15% 25%, rgba(255, 255, 255, 0.05) 0%, transparent 40%),
          radial-gradient(circle at 85% 75%, rgba(255, 255, 255, 0.03) 0%, transparent 30%),
          radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 25%)`
      };
    }
  };

  // Calculate hand angles based on current time
  const getHandAngles = () => {
    const hours = currentTime.getHours() % 12;
    const minutes = currentTime.getMinutes();
    const seconds = currentTime.getSeconds();
    
    return {
      hour: (hours * 30) + (minutes * 0.5), // 30 degrees per hour + minute adjustment
      minute: minutes * 6, // 6 degrees per minute
      second: seconds * 6  // 6 degrees per second
    };
  };

  const { hour: hourAngle, minute: minuteAngle, second: secondAngle } = getHandAngles();

  // Initialize ambient audio
  const initializeAmbientAudio = useCallback(() => {
    if (!audioInitialized && soundEnabled) {
      try {
        const audio = new Audio('/assets/sounds/ambient-background.mp3');
        audio.loop = true;
        audio.volume = 0.3; // Subtle background volume
        audio.preload = 'auto';
        
        // Handle audio loading
        audio.addEventListener('canplaythrough', () => {
          setAmbientAudio(audio);
          setAudioInitialized(true);
          
          // Start playing ambient audio
          audio.play().catch(error => {
            console.log('Ambient audio autoplay prevented:', error);
          });
        });
        
        audio.addEventListener('error', () => {
          console.log('Ambient audio file not found, continuing without background audio');
          setAudioInitialized(true);
        });
        
      } catch (error) {
        console.log('Error initializing ambient audio:', error);
        setAudioInitialized(true);
      }
    }
  }, [audioInitialized, soundEnabled]);

  // Start ambient audio
  const startAmbientAudio = useCallback(() => {
    if (ambientAudio && soundEnabled && !isChiming) {
      ambientAudio.play().catch(error => {
        console.log('Could not start ambient audio:', error);
      });
    }
  }, [ambientAudio, soundEnabled, isChiming]);

  // Stop ambient audio
  const stopAmbientAudio = useCallback(() => {
    if (ambientAudio) {
      ambientAudio.pause();
    }
  }, [ambientAudio]);

  // Handle user interaction to enable audio
  const handleUserInteraction = useCallback(() => {
    if (!audioInitialized) {
      initializeAmbientAudio();
    } else if (ambientAudio && soundEnabled && !isChiming) {
      startAmbientAudio();
    }
  }, [audioInitialized, initializeAmbientAudio, ambientAudio, soundEnabled, isChiming, startAmbientAudio]);

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
    
    // Immediately stop ambient audio during chime with fade out
    if (ambientAudio) {
      ambientAudio.pause();
      ambientAudio.currentTime = 0; // Reset to beginning for next play
    }
    
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

    // Stop chiming animation and resume ambient audio after 6 seconds
    setTimeout(() => {
      setIsChiming(false);
      // Resume ambient audio after chime ends with a gentle delay
      setTimeout(() => {
        if (soundEnabled && ambientAudio) {
          ambientAudio.volume = 0.3; // Reset volume
          startAmbientAudio();
        }
      }, 1500); // Longer pause before resuming ambient for clear separation
    }, 6000);
  }, [soundEnabled, playSimpleChime, ambientAudio, startAmbientAudio]);

  // Handle sound enabled/disabled changes and chiming state
  useEffect(() => {
    if (isChiming && ambientAudio) {
      // Ensure ambient audio is stopped during chiming
      ambientAudio.pause();
    } else if (soundEnabled && ambientAudio && !isChiming) {
      startAmbientAudio();
    } else if (!soundEnabled && ambientAudio) {
      stopAmbientAudio();
    }
  }, [soundEnabled, ambientAudio, isChiming, startAmbientAudio, stopAmbientAudio]);

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
    <div className="min-h-screen flex items-center justify-center p-4 transition-all duration-1000" 
         style={getTimeBasedBackground()}
         onClick={handleUserInteraction}>

      <div className="relative bg-gradient-to-b from-amber-50 to-cream-100 p-8 shadow-2xl border-4 border-yellow-600 max-w-md w-full backdrop-blur-sm"
           style={{
             background: 'linear-gradient(145deg, rgba(254, 252, 232, 0.95), rgba(254, 243, 199, 0.95), rgba(254, 215, 170, 0.95))',
             borderRadius: '20px 20px 40px 40px',
             clipPath: 'polygon(10% 0%, 90% 0%, 100% 15%, 100% 85%, 90% 100%, 10% 100%, 0% 85%, 0% 15%)',
             boxShadow: `
               0 25px 50px -12px rgba(0, 0, 0, 0.4),
               inset 0 2px 4px rgba(255, 255, 255, 0.6),
               0 0 0 2px rgba(184, 134, 11, 0.3),
               inset 0 -4px 8px rgba(0, 0, 0, 0.1)
             `
           }}>
        
        {/* Ornate decorative elements for mantel clock */}
        <div className="absolute top-4 left-4 w-6 h-6 border-l-3 border-t-3 border-yellow-700 opacity-60 rounded-tl-lg"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-r-3 border-t-3 border-yellow-700 opacity-60 rounded-tr-lg"></div>
        <div className="absolute bottom-6 left-6 w-8 h-8 border-l-4 border-b-4 border-yellow-600 opacity-40 rounded-bl-xl"></div>
        <div className="absolute bottom-6 right-6 w-8 h-8 border-r-4 border-b-4 border-yellow-600 opacity-40 rounded-br-xl"></div>
        
        {/* Mantel clock feet */}
        <div className="absolute bottom-0 left-8 w-4 h-3 bg-yellow-700 rounded-t-lg opacity-70"></div>
        <div className="absolute bottom-0 right-8 w-4 h-3 bg-yellow-700 rounded-t-lg opacity-70"></div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-yellow-700 rounded-t-lg opacity-70"></div>

        {/* Header with aristocratic styling */}
        <div className="text-center mb-6 relative">
          <Crown className="w-6 h-6 text-yellow-700 mx-auto mb-2" />
          <h1 className="text-xl font-serif font-bold text-amber-900 mb-1 tracking-wide">
            The Count's Timepiece
          </h1>
          <div className="h-px bg-gradient-to-r from-transparent via-yellow-600 to-transparent mb-1"></div>
          <p className="text-amber-700 text-xs italic font-serif">
            "Time marks the rhythm of a gentleman's day"
          </p>
        </div>

        {/* Main Analog Clock Display */}
        <div className="text-center mb-8 relative">
          {/* Digital time display (smaller, below clock) */}
          <div className="text-lg font-serif text-amber-800 mb-4">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          
          {/* Analog Clock Face */}
          <div className="relative mx-auto w-64 h-64 mb-4">
            {/* Clock Face Background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 border-8 border-yellow-700 shadow-2xl"
                 style={{
                   background: 'radial-gradient(circle at 30% 30%, #fefce8, #fef3c7, #fed7aa)',
                   boxShadow: `
                     inset 0 4px 8px rgba(0, 0, 0, 0.1),
                     inset 0 -2px 4px rgba(255, 255, 255, 0.8),
                     0 8px 32px rgba(0, 0, 0, 0.3)
                   `
                 }}>
              
              {/* Hour Markers */}
              {[...Array(12)].map((_, i) => {
                const angle = i * 30;
                const isMainHour = i % 3 === 0;
                return (
                  <div
                    key={i}
                    className="absolute w-1 bg-amber-900"
                    style={{
                      height: isMainHour ? '24px' : '16px',
                      left: '50%',
                      top: isMainHour ? '8px' : '12px',
                      transformOrigin: '50% 120px',
                      transform: `translateX(-50%) rotate(${angle}deg)`
                    }}
                  />
                );
              })}
              
              {/* Roman Numerals */}
              {['XII', 'III', 'VI', 'IX'].map((numeral, i) => {
                const positions = [
                  { top: '16px', left: '50%', transform: 'translateX(-50%)' }, // XII
                  { top: '50%', right: '16px', transform: 'translateY(-50%)' }, // III
                  { bottom: '16px', left: '50%', transform: 'translateX(-50%)' }, // VI
                  { top: '50%', left: '16px', transform: 'translateY(-50%)' }  // IX
                ];
                return (
                  <div
                    key={i}
                    className="absolute text-xl font-bold text-amber-900 font-serif"
                    style={positions[i]}
                  >
                    {numeral}
                  </div>
                );
              })}
              
              {/* Clock Hands */}
              {/* Hour Hand */}
              <div
                className="absolute bg-amber-900 rounded-full origin-bottom"
                style={{
                  width: '6px',
                  height: '70px',
                  left: '50%',
                  bottom: '50%',
                  transformOrigin: '50% 100%',
                  transform: `translateX(-50%) rotate(${hourAngle}deg)`,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}
              />
              
              {/* Minute Hand */}
              <div
                className="absolute bg-amber-800 rounded-full origin-bottom"
                style={{
                  width: '4px',
                  height: '90px',
                  left: '50%',
                  bottom: '50%',
                  transformOrigin: '50% 100%',
                  transform: `translateX(-50%) rotate(${minuteAngle}deg)`,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}
              />
              
              {/* Second Hand */}
              <div
                className="absolute bg-red-600 rounded-full origin-bottom transition-transform duration-75"
                style={{
                  width: '2px',
                  height: '100px',
                  left: '50%',
                  bottom: '50%',
                  transformOrigin: '50% 100%',
                  transform: `translateX(-50%) rotate(${secondAngle}deg)`,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                }}
              />
              
              {/* Center Hub */}
              <div className="absolute w-4 h-4 bg-yellow-700 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-amber-900"
                   style={{
                     boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)'
                   }}
              />
            </div>
          </div>
          
          {/* Digital Time (small, for reference) */}
          <div className="text-sm font-serif text-amber-700 opacity-75">
            {currentTime.toLocaleTimeString('en-US', {
              hour12: true,
              hour: 'numeric',
              minute: '2-digit'
            })}
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
        <div className="flex justify-center gap-4 mb-4">
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

        {/* Ambient Audio Status */}
        {soundEnabled && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
              <div className={`w-2 h-2 rounded-full ${ambientAudio && !isChiming && !ambientAudio.paused ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-xs font-serif">
                {!audioInitialized 
                  ? 'Click anywhere to enable ambient sounds' 
                  : isChiming
                    ? 'Ambient paused during chimes'
                  : ambientAudio && !ambientAudio.paused
                    ? 'Hotel ambience playing softly' 
                    : 'Ambient sounds ready'}
              </span>
            </div>
          </div>
        )}

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
