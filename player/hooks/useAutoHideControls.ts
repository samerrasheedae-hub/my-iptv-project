import { useEffect, useRef, useState } from 'react';

export function useAutoHideControls(enabled: boolean, delayMs = 3500) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    if (enabled) timer.current = setTimeout(() => setVisible(false), delayMs);
  };

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  useEffect(() => {
    show();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, delayMs]);

  return { visible, show, hide, setVisible };
}
