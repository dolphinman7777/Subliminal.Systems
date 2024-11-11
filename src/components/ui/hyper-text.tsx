"use client";

import React, { useEffect, useState } from 'react';

interface HyperTextProps {
  text: string;
  className?: string;
  duration?: number;
  animateOnLoad?: boolean;
}

const HyperText: React.FC<HyperTextProps> = ({
  text,
  className = "",
  duration = 1000,
  animateOnLoad = true
}) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const scrambleText = (onComplete?: () => void) => {
    let iterations = 0;
    const maxIterations = 3;
    const interval = duration / (text.length * maxIterations);
    
    const animate = () => {
      const scrambled = text.split('').map((char, index) => {
        if (char === ' ' || char === '.') return char;
        const progress = iterations / maxIterations;
        const shouldKeepOriginal = Math.random() < progress || index < progress * text.length;
        return shouldKeepOriginal ? char : characters[Math.floor(Math.random() * characters.length)];
      }).join('');
      
      setDisplayText(scrambled);
      iterations++;

      if (iterations < text.length * maxIterations) {
        setTimeout(animate, interval);
      } else {
        setDisplayText(text);
        onComplete?.();
      }
    };

    animate();
  };

  useEffect(() => {
    if (animateOnLoad) {
      scrambleText();
    }
  }, [text]); // Only depend on text to prevent unwanted animations

  return (
    <div 
      className={`font-mono transition-all ${className}`}
      onMouseEnter={() => {
        setIsHovering(true);
        scrambleText(() => setIsHovering(false));
      }}
      style={{ cursor: 'pointer' }}
    >
      {displayText}
    </div>
  );
};

export default HyperText;
