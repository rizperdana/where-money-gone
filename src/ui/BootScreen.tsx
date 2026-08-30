import { useEffect, useState } from 'react';

// ponytail: single-line boot, faster than multi-line typewriter — modern pace.
export default function BootScreen({ onDone }: { onDone: () => void }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), 600);
    const doneT = window.setTimeout(onDone, 1100);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(doneT);
    };
  }, [onDone]);

  return (
    <div className="wmg-panel m-2 flex items-center justify-center min-h-[60vh]">
      <h1 className={`wmg-title text-2xl ${done ? 'wmg-cursor' : ''}`}>
        WHERE MONEY GONE
      </h1>
    </div>
  );
}
