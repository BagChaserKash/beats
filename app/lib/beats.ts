export const MUSICAL_KEYS = [
  'C major', 'C minor', 'C# major', 'C# minor', 'D major', 'D minor',
  'Eb major', 'Eb minor', 'E major', 'E minor', 'F major', 'F minor',
  'F# major', 'F# minor', 'G major', 'G minor', 'Ab major', 'Ab minor',
  'A major', 'A minor', 'Bb major', 'Bb minor', 'B major', 'B minor',
];

export type FileKind = 'artwork' | 'master_mp3' | 'master_wav' | 'trackout_zip' | 'preview_mp3';

export const FILE_SLOTS: {
  kind: Exclude<FileKind, 'preview_mp3'>;
  label: string;
  hint: string;
  accept: string;
}[] = [
  { kind: 'artwork', label: 'Cover artwork', hint: 'JPG, PNG, or WebP. Square, at least 1000×1000.', accept: '.jpg,.jpeg,.png,.webp' },
  { kind: 'master_mp3', label: 'Untagged MP3', hint: 'Delivered with the MP3 Lease. 320 kbps recommended.', accept: '.mp3' },
  { kind: 'master_wav', label: 'Untagged WAV', hint: 'Delivered with WAV, Trackout, Unlimited, and Exclusive.', accept: '.wav' },
  { kind: 'trackout_zip', label: 'Trackouts (stems ZIP)', hint: 'One ZIP of all stems. Up to 5 GB.', accept: '.zip' },
];

export function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function money(cents: number | null | undefined) {
  if (cents == null) return '—';
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}
