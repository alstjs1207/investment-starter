import { Link } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useMarketStore } from '@/stores/marketStore';
import {
  formatCurrency,
  formatNumber,
  validateSectorWeights,
  calculateWeights,
  calculateRebalance,
} from '@/utils/calc';
import WeightTable from '@/components/WeightTable';
import SectorDonutChart from '@/components/charts/SectorDonutChart';
import AssetTreemap from '@/components/charts/AssetTreemap';

export default function HomePage() {
  const { portfolio } = usePortfolioStore();
  const { quotes, exchangeRate, exchangeRateUpdatedAt, loading, fetchAllQuotes, fetchRate } =
    useMarketStore();
  const sectorValidation = validateSectorWeights(portfolio);
  const hasSectors = portfolio.sectors.length > 0;

  const allStocks = portfolio.sectors.flatMap((s) =>
    s.companies.map((c) => ({ ticker: c.ticker, market: c.market })),
  );

  const handleRefresh = () => {
    if (allStocks.length > 0) fetchAllQuotes(allStocks);
    fetchRate();
  };

  const sectorWeights = calculateWeights(portfolio, quotes, exchangeRate);

  const deviationCount = calculateRebalance(portfolio, quotes, exchangeRate).length;

  return (
    <div className="space-y-5">
      {!hasSectors ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-slate-100 p-5">
            <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mt-4 text-slate-500">포트폴리오를 설정하면 여기에 요약이 표시됩니다.</p>
          <Link to="/settings" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline">
            설정으로 이동
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : (
        <>
          {/* 히어로: 예산 요약 */}
          {(() => {
            const rate = exchangeRate ?? 1300;
            const usedBudget = sectorWeights.reduce(
              (sum, sw) => sum + sw.purchaseAmountKRW + sw.purchaseAmountUSD * rate,
              0,
            );
            const remainBudget = portfolio.totalBudget - usedBudget;
            const usagePercent = portfolio.totalBudget > 0
              ? Math.min((usedBudget / portfolio.totalBudget) * 100, 100)
              : 0;

            return (
              <div className="overflow-hidden rounded-xl bg-slate-900 shadow-lg">
                <div className="px-5 py-5 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">총 예산</p>
                      <p className="mt-1 tabular-nums text-3xl font-bold text-white">
                        {formatCurrency(portfolio.totalBudget, 'KRW')}
                      </p>
                    </div>
                    <button
                      onClick={handleRefresh}
                      disabled={loading}
                      className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 disabled:opacity-50"
                    >
                      {loading ? '조회 중...' : '시세 조회'}
                    </button>
                  </div>

                  {/* 사용률 바 */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">예산 사용률</span>
                      <span className="tabular-nums font-medium text-slate-300">{usagePercent.toFixed(1)}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePercent > 100 ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* 사용/잔액 */}
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-700/50 pt-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500">사용 예산</p>
                      <p className="mt-0.5 tabular-nums text-lg font-semibold text-white">
                        {formatCurrency(Math.round(usedBudget), 'KRW')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">남은 예산</p>
                      <p className={`mt-0.5 tabular-nums text-lg font-semibold ${remainBudget < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {formatCurrency(Math.round(remainBudget), 'KRW')}
                      </p>
                    </div>
                    {exchangeRate && (
                      <div className="hidden sm:block">
                        <p className="text-xs text-slate-500">환율 (USD/KRW)</p>
                        <p className="mt-0.5 tabular-nums text-lg font-semibold text-white">
                          {formatNumber(exchangeRate, 2)}
                        </p>
                        {exchangeRateUpdatedAt && (
                          <p className="text-xs text-slate-600">
                            {new Date(exchangeRateUpdatedAt).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 이탈 알림 배너 */}
          {deviationCount > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100">
                <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-rose-800">
                  시가 기준 비중 이탈 <span className="tabular-nums">{deviationCount}건</span> 감지
                </p>
                <p className="mt-0.5 text-xs text-rose-600">리밸런싱이 필요할 수 있습니다.</p>
              </div>
              <Link to="/rebalance" className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-700">
                확인하기
              </Link>
            </div>
          )}

          {/* 모바일 환율 (sm에서 숨겼으므로) */}
          {exchangeRate && (
            <div className="grid grid-cols-2 gap-3 sm:hidden">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500">환율 (USD/KRW)</p>
                <p className="mt-1 tabular-nums text-lg font-bold text-slate-900">{formatNumber(exchangeRate, 2)}</p>
              </div>
            </div>
          )}

          {/* 평가금액 카드 */}
          {Object.keys(quotes).length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-slate-500">총 평가금액 (KRW)</p>
                </div>
                <p className="mt-2 tabular-nums text-xl font-bold text-slate-900">
                  {formatCurrency(
                    sectorWeights.reduce((s, sw) => s + sw.marketValueKRW, 0),
                    'KRW',
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-slate-500">총 평가금액 (USD)</p>
                </div>
                <p className="mt-2 tabular-nums text-xl font-bold text-slate-900">
                  {formatCurrency(
                    sectorWeights.reduce((s, sw) => s + sw.marketValueUSD, 0),
                    'USD',
                  )}
                </p>
              </div>
            </div>
          )}

          {/* 섹터 비중 경고 */}
          {!sectorValidation.isValid && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm text-amber-800">
                섹터 비중 합계: <span className="tabular-nums font-semibold">{sectorValidation.total}%</span> / 100%
                {sectorValidation.diff > 0
                  ? <span className="text-rose-600"> (+{sectorValidation.diff}%p 초과)</span>
                  : <span> ({sectorValidation.diff}%p 미배분)</span>}
              </p>
            </div>
          )}

          {/* 섹터 비중 도넛 차트 */}
          <SectorDonutChart sectors={sectorWeights} />

          {/* 자산 배분 트리맵 */}
          {Object.keys(quotes).length > 0 && (
            <AssetTreemap sectors={sectorWeights} exchangeRate={exchangeRate} />
          )}

          {/* 섹터별 비중 */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">섹터별 비중</h2>
            <WeightTable sectors={sectorWeights} quotes={quotes} />
          </div>
        </>
      )}
    </div>
  );
}
