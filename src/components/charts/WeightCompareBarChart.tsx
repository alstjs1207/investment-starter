import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SectorWeight } from '@/utils/calc';

interface Props {
  sectors: SectorWeight[];
}

export default function WeightCompareBarChart({ sectors }: Props) {
  if (sectors.length === 0) return null;

  const data = sectors.map((s) => ({
    name: s.name,
    목표: parseFloat(s.targetWeight.toFixed(1)),
    현재: parseFloat(s.marketWeight.toFixed(1)),
  }));

  const hasMarketData = data.some((d) => d.현재 > 0);
  if (!hasMarketData) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">목표 vs 현재 비중</h2>
      </div>
      <div className="px-2 py-4">
        <ResponsiveContainer width="100%" height={Math.max(data.length * 56, 160)}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={90}
              tick={{ fontSize: 12, fill: '#475569' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name) => [`${Number(value).toFixed(1)}%`, String(name)]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="목표" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={14} />
            <Bar dataKey="현재" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
