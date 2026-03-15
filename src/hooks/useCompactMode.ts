import { useState, useEffect } from 'react';
import { setCompactMode, getCompactMode } from '../labels';

export function useCompactMode() {
  const [isCompact, setIsCompact] = useState(getCompactMode());

  useEffect(() => {
    // Listen for global compact mode changes
    const handleModeChange = () => {
      setIsCompact(getCompactMode());
    };

    window.addEventListener('compactModeToggled', handleModeChange);
    return () => window.removeEventListener('compactModeToggled', handleModeChange);
  }, []);

  const toggleCompactMode = (enabled: boolean) => {
    setCompactMode(enabled);
    setIsCompact(enabled);
    // Dispatch event so other components know to re-render
    window.dispatchEvent(new Event('compactModeToggled'));
  };

  return { isCompact, toggleCompactMode };
}
