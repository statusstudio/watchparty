import React, { useState, useEffect } from 'react';

const TYPEWRITER_WORDS = [
  'spend time',
  'listen to music',
  'watch videos',
  'sing karaoke',
  'voice chat',
  'play games',
  'have fun',
];

export const TypewriterHero: React.FC = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState('spend time');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = TYPEWRITER_WORDS[wordIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting) {
      // Typing characters
      if (displayText.length < currentWord.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length + 1));
        }, 90);
      } else {
        // Finished typing word: pause to let user read
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      // Deleting characters
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(currentWord.slice(0, displayText.length - 1));
        }, 45);
      } else {
        // Finished deleting: move to next word
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % TYPEWRITER_WORDS.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, wordIndex]);

  return (
    <div className="font-mono font-bold tracking-tight text-3xl sm:text-4xl md:text-5xl my-2 select-none">
      <div className="relative inline-flex items-center justify-center">
        {/* Invisible longest phrase placeholder to guarantee Zero Layout Shift */}
        <span className="invisible select-none opacity-0 pointer-events-none">
          listen to music &nbsp;together
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[#0075de]">{displayText}</span>
          <span className="inline-block w-[3px] h-[0.9em] bg-[#0075de] mx-1 animate-pulse align-middle rounded-xs" />
          <span className="text-[#000000]">together</span>
        </div>
      </div>
    </div>
  );
};
