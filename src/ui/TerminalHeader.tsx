// ponytail: thin cosmetic component, shows current route as a fake DOS prompt.
export default function TerminalHeader({ route }: { route: string }) {
  return (
    <header className="wmg-panel mb-2 flex items-center justify-between font-mono text-xs">
      <span>WHERE MONEY GONE v1.0</span>
      <span className="text-[var(--wmg-fg-dim)]">C:\{route}&gt;</span>
    </header>
  );
}
