// ponytail: separate file from the component so react-refresh stays happy.
let push: ((msg: string) => void) | null = null;
let counter = 0;

export function notify(message: string) {
  push?.(message);
}

export function attachListener(fn: (msg: string) => void): () => void {
  push = fn;
  return () => {
    if (push === fn) push = null;
  };
}

export function nextToastId(): number {
  return ++counter;
}
