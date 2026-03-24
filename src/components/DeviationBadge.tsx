import type { DeviationStatus } from '@/utils/calc';

interface Props {
  status: DeviationStatus;
  diff: number;
}

const config = {
  over: { label: '▲ 초과', color: 'text-rose-600' },
  under: { label: '▼ 미달', color: 'text-blue-600' },
  normal: { label: '✓ 정상', color: 'text-emerald-600' },
} as const;

export default function DeviationBadge({ status, diff }: Props) {
  const c = config[status];
  return (
    <span className={`tabular-nums text-xs font-medium ${c.color}`}>
      {status === 'normal'
        ? c.label
        : `${c.label} ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%p`}
    </span>
  );
}
