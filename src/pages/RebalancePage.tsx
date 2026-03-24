import { Link } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useMarketStore } from '@/stores/marketStore';
import {
  calculateRebalance,
  calculateWeights,
  formatCurrency,
  formatNumber,
} from '@/utils/calc';
import type { RebalanceItem, RebalanceAction } from '@/utils/calc';
import type { Portfolio } from '@/types';
import WeightCompareBarChart from '@/components/charts/WeightCompareBarChart';

function ActionBadge({ action }: { action: RebalanceItem['action'] }) {
  if (action === 'sell') {
    return (
      <span className="inline-flex items-center rounded-md bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-500/20">
        매도
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-500/20">
      매수
    </span>
  );
}

export default function RebalancePage() {
  const { portfolio } = usePortfolioStore();
  const { quotes, exchangeRate, loading, fetchAllQuotes, fetchRate } = useMarketStore();

  const allStocks = portfolio.sectors.flatMap((s) =>
    s.companies.map((c) => ({ ticker: c.ticker, market: c.market })),
  );

  const handleRefresh = () => {
    if (allStocks.length > 0) fetchAllQuotes(allStocks);
    fetchRate();
  };

  const items = calculateRebalance(portfolio, quotes, exchangeRate);
  const sellItems = items.filter((i) => i.action === 'sell');
  const buyItems = items.filter((i) => i.action === 'buy');

  const hasPurchases = portfolio.sectors.some((s) =>
    s.companies.some((c) => c.purchases.length > 0),
  );

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V4.5" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">리밸런싱 추천</h1>
            <p className="text-sm text-slate-500">목표 비중에 맞춘 매매 추천</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? '조회 중...' : '시세 조회'}
        </button>
      </div>

      {!hasPurchases ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 shadow-sm">
          <div className="rounded-full bg-slate-100 p-4">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V4.5" />
            </svg>
          </div>
          <p className="mt-3 text-slate-500">매수 기록이 없어 리밸런싱을 계산할 수 없습니다.</p>
          <Link to="/settings" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline">
            포트폴리오 설정으로 이동
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      ) : items.length === 0 && Object.keys(quotes).length > 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 py-12 shadow-sm">
          <div className="rounded-full bg-emerald-100 p-3">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-3 text-lg font-semibold text-emerald-800">포트폴리오가 균형 상태입니다</p>
          <p className="mt-1 text-sm text-emerald-600">리밸런싱이 필요하지 않습니다.</p>
        </div>
      ) : (
        <>
          {/* 목표 vs 현재 비중 비교 차트 */}
          {(() => {
            const weights = calculateWeights(portfolio, quotes, exchangeRate);
            return <WeightCompareBarChart sectors={weights} />;
          })()}

          {/* 면책 안내 */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            수수료 및 세금은 계산에 포함되지 않았습니다. 실제 매매 시 별도로 확인해 주세요.
          </div>

          {/* 섹터 단위 액션 안내 */}
          {(() => {
            const sectorActions = new Map<string, { name: string; action: RebalanceAction; diff: number }>();
            items.forEach((item) => {
              if (item.sectorAction && !sectorActions.has(item.sectorId)) {
                sectorActions.set(item.sectorId, {
                  name: item.sectorName,
                  action: item.sectorAction,
                  diff: item.sectorMarketDiff,
                });
              }
            });
            if (sectorActions.size === 0) return null;
            return (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">섹터 단위 이탈 안내</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-amber-700">
                    {Array.from(sectorActions.values()).map((info, i) => (
                      <li key={i}>
                        {info.name} 섹터 전체가 목표 대비{' '}
                        <span className="tabular-nums font-semibold">
                          {info.diff > 0 ? '+' : ''}{info.diff.toFixed(1)}%p
                        </span>{' '}
                        {info.action === 'sell' ? '초과' : '미달'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}

          {/* 요약 카운트 */}
          <div className="grid grid-cols-2 gap-3">
            {sellItems.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-medium text-blue-600">매도 추천</p>
                <p className="mt-1 text-2xl font-bold text-blue-800">{sellItems.length}<span className="ml-1 text-sm font-medium">종목</span></p>
              </div>
            )}
            {buyItems.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-medium text-red-600">매수 추천</p>
                <p className="mt-1 text-2xl font-bold text-red-800">{buyItems.length}<span className="ml-1 text-sm font-medium">종목</span></p>
              </div>
            )}
          </div>

          {/* 매도 추천 */}
          {sellItems.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">매도 추천</h2>
              <div className="space-y-2">
                {sellItems.map((item) => (
                  <RebalanceCard key={item.companyId} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* 매도 실행 시 비중 변화 */}
          {sellItems.length > 0 && (
            <SectorWeightProjection
              portfolio={portfolio}
              quotes={quotes}
              exchangeRate={exchangeRate}
              sellItems={sellItems}
            />
          )}

          {/* 매수 추천 */}
          {buyItems.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">매수 추천</h2>
              <div className="space-y-2">
                {buyItems.map((item) => (
                  <RebalanceCard key={item.companyId} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RebalanceCard({ item }: { item: RebalanceItem }) {
  return (
    <Link
      to={`/stock/${item.companyId}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-slate-300"
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
              item.action === 'sell' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
            }`}>
              {item.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <ActionBadge action={item.action} />
                <span className="font-medium text-slate-800">{item.name}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-mono">{item.ticker}</span>
                <span>·</span>
                <span>{item.market}</span>
                {item.sectorAction && (
                  <>
                    <span>·</span>
                    <span className="text-amber-600">{item.sectorName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`tabular-nums text-lg font-bold ${item.action === 'sell' ? 'text-blue-700' : 'text-red-700'}`}>
              {item.action === 'sell' ? '-' : '+'}
              {formatNumber(item.deltaQuantity)}주
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-4">
          <div>
            <span className="block text-slate-400">현재 보유</span>
            <span className="tabular-nums font-medium text-slate-700">{formatNumber(item.currentQuantity)}주</span>
          </div>
          <div>
            <span className="block text-slate-400">목표 수량</span>
            <span className="tabular-nums font-medium text-slate-700">{formatNumber(item.targetQuantity)}주</span>
          </div>
          <div>
            <span className="block text-slate-400">현재가</span>
            <span className="tabular-nums font-medium text-slate-700">{formatCurrency(item.currentPrice, item.currency)}</span>
          </div>
          <div>
            <span className="block text-slate-400">
              예상 {item.action === 'sell' ? '매도' : '매수'}금액
            </span>
            <span className="tabular-nums font-semibold text-slate-900">
              {formatCurrency(item.estimatedAmount, item.currency)}
            </span>
          </div>
        </div>

        {item.action === 'sell' && item.realizedPnL != null && (
          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-400">예상 실현 손익</span>
            <span className={`tabular-nums font-semibold ${item.realizedPnL >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {item.realizedPnL >= 0 ? '+' : ''}{formatCurrency(item.realizedPnL, item.currency)}
            </span>
            {item.realizedPnLRate != null && (
              <span className={`tabular-nums ${item.realizedPnLRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                ({item.realizedPnLRate >= 0 ? '+' : ''}{item.realizedPnLRate.toFixed(1)}%)
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function SectorWeightProjection({
  portfolio,
  quotes,
  exchangeRate,
  sellItems,
}: {
  portfolio: Portfolio;
  quotes: Record<string, { price: number }>;
  exchangeRate: number | null;
  sellItems: RebalanceItem[];
}) {
  const rate = exchangeRate ?? 1300;
  const weights = calculateWeights(portfolio, quotes, exchangeRate);
  const totalBudget = portfolio.totalBudget;
  if (totalBudget === 0) return null;

  const sellAmountBySector = new Map<string, number>();
  for (const item of sellItems) {
    const amountKRW = item.currency === 'KRW'
      ? item.estimatedAmount
      : item.estimatedAmount * rate;
    sellAmountBySector.set(
      item.sectorId,
      (sellAmountBySector.get(item.sectorId) ?? 0) + amountKRW,
    );
  }

  const rows = weights.map((sw) => {
    const currentMarketKRW = sw.marketValueKRW + sw.marketValueUSD * rate;
    const currentWeight = (currentMarketKRW / totalBudget) * 100;
    const sellAmount = sellAmountBySector.get(sw.sectorId) ?? 0;
    const afterMarketKRW = currentMarketKRW - sellAmount;
    const afterWeight = (afterMarketKRW / totalBudget) * 100;

    return {
      name: sw.name,
      targetWeight: sw.targetWeight,
      currentWeight,
      afterWeight,
      diff: afterWeight - currentWeight,
      hasSell: sellAmount > 0,
    };
  });

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">매도 실행 시 비중 변화</h2>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium text-slate-500">
                <th className="px-4 py-2.5">섹터</th>
                <th className="px-4 py-2.5 text-right">목표</th>
                <th className="px-4 py-2.5 text-right">현재</th>
                <th className="px-4 py-2.5 text-right">매도 후</th>
                <th className="px-4 py-2.5 text-right">변동</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-slate-50 last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{row.name}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-slate-500">{row.targetWeight.toFixed(1)}%</td>
                  <td className="tabular-nums px-4 py-2.5 text-right">{row.currentWeight.toFixed(1)}%</td>
                  <td className={`tabular-nums px-4 py-2.5 text-right font-medium ${row.hasSell ? 'text-blue-700' : ''}`}>
                    {row.afterWeight.toFixed(1)}%
                  </td>
                  <td className="tabular-nums px-4 py-2.5 text-right">
                    {row.diff !== 0 ? (
                      <span className={row.diff > 0 ? 'text-red-500' : 'text-blue-500'}>
                        {row.diff > 0 ? '+' : ''}{row.diff.toFixed(1)}%p
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
