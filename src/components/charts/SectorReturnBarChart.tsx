import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { formatNumber } from '@/utils/calc';

interface SectorData {
  name: string;
  returnRate: number;
  marketValueKRW: number;
}

interface Props {
  sectors: SectorData[];
}

export default function SectorReturnBarChart({ sectors }: Props) {
  const data = sectors.filter((s) => s.marketValueKRW > 0);
  if (data.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">섹터별 수익률</h2>
      </div>
      <div className="px-2 py-4">
        <ResponsiveContainer width="100%" height={Math.max(data.length * 52, 120)}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => `${v.toFixed(0)}%`}
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
              formatter={(value, _name, props) => {
                const v = Number(value);
                const mv = (props?.payload as SectorData)?.marketValueKRW ?? 0;
                return [
                  `${v >= 0 ? '+' : ''}${v.toFixed(2)}% (평가 ${formatNumber(Math.round(mv))}원)`,
                  '수익률',
                ];
              }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <ReferenceLine x={0} stroke="#cbd5e1" />
            <Bar dataKey="returnRate" radius={[0, 4, 4, 0]} barSize={28}>
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.returnRate >= 0 ? '#ef4444' : '#3b82f6'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
