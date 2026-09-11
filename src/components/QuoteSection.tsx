import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface QuoteSectionProps {
  feltTextVisible: boolean;
}

export const QuoteSection: React.FC<QuoteSectionProps> = ({ feltTextVisible }) => {
  return (
    <div
      id="quote-container"
      className="pointer-events-none relative z-10 flex flex-col items-center justify-end w-full max-w-[320px] sm:max-w-[380px] mx-auto px-4 pb-5 sm:pb-7 select-none"
    >
      {/* Tap Feedback Message: "Did you feel that? ♡" (appears for ~1.5s) */}
      <div className="h-6 mb-1 flex items-center justify-center">
        <AnimatePresence>
          {feltTextVisible && (
            <motion.p
              id="felt-that-message"
              initial={{ opacity: 0, y: 5, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-[#fecdd3] text-xs sm:text-sm font-normal tracking-wide font-serif-romantic italic drop-shadow-[0_0_10px_rgba(251,113,133,0.55)]"
            >
              Did you feel that? ♡
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Main Emotional Romantic Quote with bouncy spring reveal */}
      <motion.div
        id="quote-body"
        initial={{ opacity: 0, scale: 0.88, y: 22 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          opacity: { duration: 0.75, ease: 'easeOut', delay: 0.45 },
          y: {
            type: 'spring',
            damping: 14,
            stiffness: 95,
            mass: 0.9,
            delay: 0.45,
          },
          scale: {
            type: 'spring',
            damping: 13,
            stiffness: 90,
            mass: 0.9,
            delay: 0.45,
          },
        }}
        className="text-center space-y-2.5 sm:space-y-3 origin-center"
      >
        <p className="font-serif-romantic text-[0.88rem] sm:text-[1.02rem] italic leading-[1.58] font-normal tracking-wide text-[#fff5f6] drop-shadow-[0_0_12px_rgba(255,215,225,0.35)]">
          Some feelings don't need to be said
          <br />
          again and again.
        </p>

        <p className="font-serif-romantic text-[0.88rem] sm:text-[1.02rem] italic leading-[1.58] font-normal tracking-wide text-[#fff5f6] drop-shadow-[0_0_12px_rgba(255,215,225,0.35)]">
          They simply live quietly inside us,
          <br />
          beating with every heartbeat.
        </p>

        <p className="font-serif-romantic text-[0.88rem] sm:text-[1.02rem] italic leading-[1.58] font-normal tracking-wide text-[#fff5f6] drop-shadow-[0_0_12px_rgba(255,215,225,0.35)]">
          And if you ever wonder where my heart is...
        </p>

        <p className="font-serif-romantic text-[0.98rem] sm:text-[1.12rem] italic leading-[1.5] font-medium tracking-wider text-[#ffffff] drop-shadow-[0_0_16px_rgba(255,182,193,0.55)]">
          it's with you.
        </p>
      </motion.div>

      {/* Dedication Footer with spring bouncy settle */}
      <motion.div
        id="quote-footer"
        initial={{ opacity: 0, scale: 0.90, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          opacity: { duration: 0.7, ease: 'easeOut', delay: 0.85 },
          y: {
            type: 'spring',
            damping: 15,
            stiffness: 110,
            mass: 0.8,
            delay: 0.85,
          },
          scale: {
            type: 'spring',
            damping: 14,
            stiffness: 100,
            mass: 0.8,
            delay: 0.85,
          },
        }}
        className="mt-4 sm:mt-5 origin-center"
      >
        <p className="font-handwritten text-sm sm:text-base tracking-wider text-[#fce7f3]/90 drop-shadow-[0_0_10px_rgba(244,114,182,0.35)]">
          — For My Jaan 🤍
        </p>
      </motion.div>
    </div>
  );
};
