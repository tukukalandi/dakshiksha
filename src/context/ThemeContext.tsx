import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  textSize: number; // 0 for A-, 1 for A, 2 for A+
  setTextSize: (size: number) => void;
  isScreenReaderOn: boolean;
  toggleScreenReader: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(pre-hooks-color-scheme: dark)').matches);
    }
    return false;
  });

  const [textSize, setTextSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('textSize') || '1');
    }
    return 1;
  });

  const [isScreenReaderOn, setIsScreenReaderOn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('screenReader') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const root = window.document.documentElement;
    const sizes = ['14px', '16px', '18px'];
    root.style.fontSize = sizes[textSize] || '16px';
    localStorage.setItem('textSize', textSize.toString());
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('screenReader', isScreenReaderOn.toString());
    
    if (!isScreenReaderOn) {
      window.speechSynthesis?.cancel();
      return;
    }

    let speakingTimeout: NodeJS.Timeout;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Skip if hovering over non-text elements or generic containers
      if (!target || !target.textContent) return;
      
      const textToRead = target.getAttribute('aria-label') || target.innerText || target.title;
      
      if (textToRead && textToRead.trim().length > 0) {
        clearTimeout(speakingTimeout);
        speakingTimeout = setTimeout(() => {
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToRead.trim().substring(0, 100)); // Read first 100 chars
            window.speechSynthesis.speak(utterance);
          }
        }, 500); // Wait 500ms before reading
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      clearTimeout(speakingTimeout);
      window.speechSynthesis?.cancel();
    };
  }, [isScreenReaderOn]);

  const toggleTheme = () => setIsDark(!isDark);
  const toggleScreenReader = () => setIsScreenReaderOn(!isScreenReaderOn);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, textSize, setTextSize, isScreenReaderOn, toggleScreenReader }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
