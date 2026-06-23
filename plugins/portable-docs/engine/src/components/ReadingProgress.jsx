import React, { useState, useEffect } from 'react';
import { COLORS } from '../design-tokens';

/** Thin fixed top bar showing document scroll progress. Hidden in print. */
const ReadingProgress = () => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="pd-reading-progress pd-no-print" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 100, background: 'transparent' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: COLORS.accent.primary, transition: 'width 100ms linear' }} />
    </div>
  );
};

export default ReadingProgress;
