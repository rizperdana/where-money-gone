// Route chip — small breadcrumb-style label.
export default function TerminalHeader({ route }: { route: string }) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>WMG /</span>
      <span className="font-medium text-foreground">{route}</span>
    </div>
  );
}
