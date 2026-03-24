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

interface StockReturnData {
  name: string;
  returnRate: number;
}

interface Props {
  stocks: StockReturnData[];
}

export default function StockReturnBarChart({ stocks }: Props) {
  if (stocks.length === 0) return null;

  // 수익률 기준 정렬
  const sorted = [...stocks].sort((a, b) => b.returnRate - a.returnRate);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">종목별 수익률 차트</h2>
      </div>
      <div className="px-2 py-4">
        <ResponsiveContainer width="100%" height={Math.max(sorted.length * 36, 120)}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
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
              width={80}
              tick={{ fontSize: 11, fill: '#475569' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`, '수익률']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <ReferenceLine x={0} stroke="#cbd5e1" />
            <Bar dataKey="returnRate" radius={[0, 4, 4, 0]} barSize={20}>
              {sorted.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.returnRate >= 0 ? '#ef4444' : '#3b82f6'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
