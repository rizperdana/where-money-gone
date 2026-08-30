// ponytail: hashes the id to pick a quote — same id always returns same quote (no flicker on re-render).
export type NarratorIntent =
  | 'empty_receipts'
  | 'loading'
  | 'save_success'
  | 'save_error'
  | 'ocr_complete'
  | 'ocr_failed'
  | 'delete_confirm'
  | 'budget_warning'
  | 'streak_broken'
  | 'achievement_unlocked'
  | 'share_prompt'
  | 'storage_full';

const QUOTES_EN: Record<NarratorIntent, string[]> = {
  empty_receipts: [
    "No receipts found. Either you're broke or you're finally living within your means. We're rooting for option two.",
    "The graveyard is empty. Suspicious.",
    "Nothing here yet. The void stares back.",
  ],
  loading: [
    'Loading disappointment database...',
    'Reading the fine print of your life choices...',
    'Asking your bank for permission...',
  ],
  save_success: [
    'Receipt saved. Another entry in the ledger of regret.',
    'Recorded. Your future self is already disappointed.',
    'Captured. The money is gone. The receipt remains.',
    'Logged. Have you considered a savings account? Just asking.',
    'Saved. At least the paper trail proves you have good taste.',
  ],
  save_error: [
    'Save failed. The receipt has escaped, like your money.',
    'Could not save. The system is as confused as your finances.',
  ],
  ocr_complete: [
    'OCR finished. The receipt has been read. The verdict is mixed.',
    'Text extracted. Some of it might even be correct.',
  ],
  ocr_failed: [
    'The scanner gave up. So did we, honestly.',
    "OCR failed. Maybe try better lighting. Or a smaller purchase.",
  ],
  delete_confirm: [
    'Delete this receipt? Your memory of the purchase will remain.',
    'Erase it forever? The receipt, not the regret.',
  ],
  budget_warning: [
    'Wallet health: dropping. The meter is concerned.',
    'Budget alert. Math is hard. So is being responsible.',
  ],
  streak_broken: [
    'Streak reset. The calendar never forgets. Neither do we.',
    'You took a day off. The streak took it personally.',
  ],
  achievement_unlocked: [
    'Achievement unlocked. The trophy is the regret.',
    'New badge. The system is reluctantly impressed.',
  ],
  share_prompt: [
    'Share this? Why. But okay.',
  ],
  storage_full: [
    'Storage is full. Like your wallet, apparently.',
    "No more room. Time to delete receipts, like deleting memories.",
  ],
};

const QUOTES: Record<NarratorIntent, string[]> = QUOTES_EN;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function say(intent: NarratorIntent, id?: string): string {
  const pool = QUOTES[intent] ?? ['...'];
  if (!id) return pool[Math.floor(Math.random() * pool.length)];
  return pool[hashId(id) % pool.length];
}
