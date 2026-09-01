import { useEffect, useState } from 'react';
import { attachListener, nextToastId } from './toast-bus';
import { Card, CardContent } from '@/components/ui/card';

interface Toast {
  id: number;
  message: string;
}

export default function TerminalToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return attachListener((message: string) => {
      const id = nextToastId();
      setToasts((prev) => [...prev, { id, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex flex-col items-center gap-1">
      {toasts.map((t) => (
        <Card key={t.id} className="pointer-events-auto max-w-md">
          <CardContent className="py-3 px-4 text-sm">{t.message}</CardContent>
        </Card>
      ))}
    </div>
  );
}
