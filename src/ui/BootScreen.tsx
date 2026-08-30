import { useEffect, useState } from 'react';

const BOOT_LINES = [
  'WHERE MONEY GONE v1.0',
  'Initializing receipt scanner...',
  'Loading disappointment engine...',
  'Calibrating regret meter...',
  'Ready. Good luck with your finances.',
];

// ponytail: timing is hardcoded; user-triggered re-skip via tap.
export default function BootScreen({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const delays = [0, 200, 400, 600, 800];
    const timers = delays.map((d, i) =>
      window.setTimeout(() => {
        if (cancelled) return;
        setShown((prev) => [...prev, BOOT_LINES[i]]);
        if (i === BOOT_LINES.length - 1) {
          window.setTimeout(() => {
            if (!cancelled) onDone();
          }, 600);
        }
      }, d),
    );
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [onDone]);

  return (
    <div className="wmg-panel m-2 font-mono text-sm leading-6">
      {shown.map((line, i) => (
        <div
          key={i}
          className={i === shown.length - 1 ? 'wmg-cursor' : undefined}
        >
          {line}
        </div>
      ))}
    </div>
  );
}
