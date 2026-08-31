import TerminalHeader from './TerminalHeader';
import { ROADMAP_ITEMS, type RoadmapStatus } from './roadmap-content';

const STATUS_COLOR: Record<RoadmapStatus, string> = {
  planned: 'var(--wmg-fg-dim)',
  'in-progress': 'var(--wmg-warning)',
  shipped: 'var(--wmg-accent)',
};

const STATUS_LABEL: Record<RoadmapStatus, string> = {
  planned: 'PLANNED',
  'in-progress': 'IN PROGRESS',
  shipped: 'SHIPPED',
};

export default function RoadmapScreen() {
  return (
    <div className="p-4 max-w-3xl mx-auto flex flex-col gap-4 pb-24">
      <TerminalHeader route="ROADMAP" />

      <h1 className="wmg-title">[ WHAT'S COMING ]</h1>
      <p className="wmg-pixel text-[0.5rem] text-[var(--wmg-fg-dim)]">
        IDEAS THAT COULD MAKE THIS SUSTAINABLE.
      </p>
      <p className="text-sm text-[var(--wmg-fg-dim)]">
        Here's what's on the horizon for Where Money Gone — features designed to generate
        revenue while staying local-first and privacy-respecting.
      </p>

      <ul className="flex flex-col gap-3">
        {ROADMAP_ITEMS.map((item) => (
          <li key={item.id} className="wmg-panel flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h2 className="wmg-pixel text-[0.625rem]">{item.title}</h2>
              <span
                className="wmg-pixel text-[0.5rem] shrink-0"
                style={{ color: STATUS_COLOR[item.status] }}
              >
                [ {STATUS_LABEL[item.status]} ]
              </span>
            </div>
            <p className="text-sm">{item.description}</p>
            <p className="text-xs text-[var(--wmg-fg-dim)]">💰 {item.monetization}</p>
            <span className="wmg-pixel text-[0.5rem] text-[var(--wmg-fg-dim)]">
              [ COST: {item.buildCost} ]
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
