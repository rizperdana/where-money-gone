// Route chip — small pixel label on the right, modern label on the left.
export default function TerminalHeader({ route }: { route: string }) {
  return (
    <header className="wmg-panel mb-2 flex items-center justify-between">
      <span className="wmg-modern text-sm">Where Money Gone</span>
      <span className="wmg-pixel text-[var(--wmg-fg-dim)]">[ {route} ]</span>
    </header>
  );
}
