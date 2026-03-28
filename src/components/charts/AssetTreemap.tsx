import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { SectorWeight } from '@/utils/calc';
import { formatNumber } from '@/utils/calc';

const COLORS = [
  '#059669', '#2563eb', '#d97706', '#dc2626', '#7c3aed',
  '#0891b2', '#ea580c', '#db2777', '#0d9488', '#4f46e5',
];

interface Props {
  sectors: SectorWeight[];
  exchangeRate: number | null;
}

interface TreemapNode {
  name: string;
  size?: number;
  children?: TreemapNode[];
  color?: string;
  sectorName?: string;
  [key: string]: unknown;
}

interface ContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  color: string;
}

function CustomContent({ x, y, width, height, name, color }: ContentProps) {
  if (width < 30 || height < 20) return null;

  const fontSize = width > 120 ? 14 : width > 80 ? 12 : 10;
  const maxChars = Math.max(4, Math.floor(width / (fontSize * 0.7)));
  const label = name.length > maxChars ? name.slice(0, maxChars - 1) + '…' : name;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={color}
        stroke="#fff"
        strokeWidth={3}
      />
      {width > 40 && height > 24 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fff"
          fontSize={fontSize}
          fontWeight={700}
          style={{
            textShadow: '0 1px 3px rgba(0,0,0,0.5), 0 0 6px rgba(0,0,0,0.3)',
            paintOrder: 'stroke fill',
            stroke: 'rgba(0,0,0,0.3)',
            strokeWidth: 2,
            strokeLinejoin: 'round',
          } as React.CSSProperties}
        >
          {label}
        </text>
      )}
    </g>
  );
}

export default function AssetTreemap({ sectors, exchangeRate }: Props) {
  const rate = exchangeRate ?? 1300;

  const treeData: TreemapNode[] = sectors
    .filter((s) => s.companies.some((c) => c.marketValue > 0))
    .map((s, sIdx) => ({
      name: s.name,
      color: COLORS[sIdx % COLORS.length],
      children: s.companies
        .filter((c) => c.marketValue > 0)
        .map((c) => {
          const valueKRW = c.market === 'KRX' ? c.marketValue : c.marketValue * rate;
          return {
            name: c.name,
            size: valueKRW,
            color: COLORS[sIdx % COLORS.length],
            sectorName: s.name,
          };
        }),
    }));

  if (treeData.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">자산 배분 트리맵</h2>
        <p className="mt-0.5 text-xs text-slate-400">박스 크기 = 평가금액 비중</p>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={280}>
          <Treemap
            data={treeData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            content={<CustomContent x={0} y={0} width={0} height={0} name="" color="" />}
          >
            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const item = payload[0]?.payload;
                if (!item?.name) return null;
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                    {item.sectorName && (
                      <p className="text-slate-400">{item.sectorName}</p>
                    )}
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="tabular-nums text-slate-600">
                      {formatNumber(Math.round(item.size))}원
                    </p>
                  </div>
                );
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-3">
        {treeData.map((d, idx) => (
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
