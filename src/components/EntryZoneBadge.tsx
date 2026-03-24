import type { EntryZoneResult } from '@/utils/calc';

const config = {
  entry_ok: { label: '진입가능', bg: 'bg-emerald-100 text-emerald-700' },
  waiting: { label: '▲ 구간까지', bg: 'bg-slate-100 text-slate-500' },
  below_zone: { label: '▼ 하단이탈', bg: 'bg-amber-100 text-amber-700' },
  not_set: null,
} as const;

interface Props {
  result: EntryZoneResult;
}

export default function EntryZoneBadge({ result }: Props) {
  const c = config[result.status];
  if (!c) return null;

  const pct = Math.abs(result.diffPercent).toFixed(1);

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.bg}`}>
      {result.status === 'entry_ok'
        ? c.label
        : `${c.label} ${result.status === 'waiting' ? '+' : '-'}${pct}%`}
    </span>
  );
}
