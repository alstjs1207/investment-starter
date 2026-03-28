import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { SectorWeight } from '@/utils/calc';

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#6366f1',
];

interface Props {
  sectors: SectorWeight[];
}

interface ChartData {
  name: string;
  value: number;
}

function shortenName(name: string) {
  // "A 섹터 - AI·반도체/부품·저장장치" → "AI·반도체/부품·저장장치"
  return name.replace(/^[A-Z]\s*섹터\s*[-–—]\s*/, '');
}

function renderLabel({
  cx,
  cy,
  midAngle,
  outerRadius,
  name,
  value,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  name?: string;
  value?: number;
}) {
  if (!value || value < 2) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 14;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const short = shortenName(name ?? '');
  return (
    <text
      x={x}
      y={y}
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={11}
      fill="#475569"
      fontWeight={500}
    >
      {short} {value.toFixed(1)}%
    </text>
  );
}

export default function SectorDonutChart({ sectors }: Props) {
  const targetData: ChartData[] = sectors
    .filter((s) => s.targetWeight > 0)
    .map((s) => ({ name: s.name, value: s.targetWeight }));

  const currentData: ChartData[] = sectors
    .filter((s) => s.marketWeight > 0)
    .map((s) => ({ name: s.name, value: parseFloat(s.marketWeight.toFixed(1)) }));

  if (targetData.length === 0) return null;

  const hasMarketData = currentData.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">섹터 비중 분포</h2>
      </div>
      <div className={`grid ${hasMarketData ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-0`}>
        {/* 목표 비중 */}
        <div className="flex flex-col items-center px-4 py-4">
          <p className="mb-2 text-xs font-medium text-slate-500">목표 비중</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={targetData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="value"
                label={renderLabel}
                labelLine={false}
                stroke="none"
              >
                {targetData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)}%`, '비중']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 현재 비중 (시가) */}
        {hasMarketData && (
          <div className="flex flex-col items-center border-t border-slate-100 px-4 py-4 sm:border-l sm:border-t-0">
            <p className="mb-2 text-xs font-medium text-slate-500">현재 비중 (시가)</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie
                  data={currentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  dataKey="value"
                  label={renderLabel}
                  labelLine={false}
                  stroke="none"
                >
                  {currentData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, '비중']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-3">
        {targetData.map((d, idx) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
            />
            {d.name}
          </div>
        ))}
      </div>
    </div>
  );
}
