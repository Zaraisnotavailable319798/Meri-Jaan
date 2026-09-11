import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { HeartCanvas } from './components/HeartCanvas';
import { QuoteSection } from './components/QuoteSection';
import { triggerHeartbeatHaptic } from './utils/haptics';

export default function App() {
  const [feltTextVisible, setFeltTextVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleHeartTap = useCallback(() => {
    // Physical reinforcement: trigger subtle heartbeat haptic vibration
    triggerHeartbeatHaptic();
    setFeltTextVisible(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // "show: 'Did you feel that? ♡' for about 1.5 seconds"
    timerRef.current = setTimeout(() => {
      setFeltTextVisible(false);
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <main
      id="romantic-heart-app"
      className="relative w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none flex flex-col justify-between items-center bg-[#1c0a22] bg-[radial-gradient(ellipse_120%_95%_at_50%_32%,_#5c2352_0%,_#491b45_24%,_#361439_48%,_#270d2c_74%,_#1a0820_100%)]"
    >
      {/* Ethereal Lavender Celestial Glow Layer */}
      <div
        id="celestial-lavender-glow"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_28%,_rgba(216,168,236,0.22)_0%,_rgba(175,114,198,0.13)_42%,_transparent_72%)] transform-gpu will-change-transform"
      />

      {/* Warm Blush-Pink & Orchid Heart Aura with Spring Reveal */}
      <motion.div
        id="heart-radial-glow"
        initial={{ opacity: 0, scale: 0.80 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          opacity: { duration: 1.2, ease: 'easeOut' },
          scale: {
            type: 'spring',
            damping: 15,
            stiffness: 75,
            mass: 0.9,
          },
        }}
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_36%,_rgba(255,120,165,0.20)_0%,_rgba(212,96,156,0.12)_34%,_transparent_64%)] origin-[50%_36%] transform-gpu will-change-transform"
      />

      {/* 3D Cute Diamond Gemstone Heart with Spring Bouncy Entrance Animation */}
      <motion.div
        id="heart-canvas-container"
        initial={{ opacity: 0, scale: 0.82 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          opacity: { duration: 0.75, ease: 'easeOut', delay: 0.1 },
          scale: {
            type: 'spring',
            damping: 12,
            stiffness: 85,
            mass: 0.85,
            delay: 0.1,
          },
        }}
        className="absolute inset-0 z-[2] pointer-events-auto origin-[50%_36%]"
      >
        <HeartCanvas onHeartTap={handleHeartTap} />
      </motion.div>

      {/* Fluid Bottom Scrim with Soft Plum Tones for Seamless Readability */}
      <div
        id="quote-readability-scrim"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 z-[5] bg-gradient-to-t from-[#18071e]/85 via-[#18071e]/32 to-transparent"
      />

      {/* Spacer to preserve clear upper-middle framing for the 3D heart */}
      <div className="flex-1 pointer-events-none" />

      {/* Emotional Quote and Dedication */}
      <QuoteSection feltTextVisible={feltTextVisible} />
    </main>
  );
}
