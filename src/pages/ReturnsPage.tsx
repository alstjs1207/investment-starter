import { Link } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useMarketStore } from '@/stores/marketStore';
import {
  calculatePortfolioReturn,
  formatCurrency,
  formatNumber,
} from '@/utils/calc';

function ProfitColor({ value, children }: { value: number; children: React.ReactNode }) {
  const color = value > 0 ? 'text-red-600' : value < 0 ? 'text-blue-600' : 'text-slate-600';
  return <span className={color}>{children}</span>;
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatPL(value: number): string {
  return `${value >= 0 ? '+' : ''}${formatNumber(Math.round(value))}원`;
}

export default function ReturnsPage() {
  const { portfolio } = usePortfolioStore();
  const { quotes, exchangeRate, loading, fetchAllQuotes, fetchRate } = useMarketStore();

  const allStocks = portfolio.sectors.flatMap((s) =>
    s.companies.map((c) => ({ ticker: c.ticker, market: c.market })),
  );

  const handleRefresh = () => {
    if (allStocks.length > 0) fetchAllQuotes(allStocks);
    fetchRate();
  };

  const ret = calculatePortfolioReturn(portfolio, quotes, exchangeRate);
  const hasData = ret.totalPurchaseKRW > 0;

  const allCompanies = ret.sectors.flatMap((s) => s.companies);
  const sorted = [...allCompanies].sort((a, b) => b.returnRate - a.returnRate);
  const best = sorted.slice(0, 3);
  const worst = sorted.slice(-3).reverse();

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">수익률</h1>
            <p className="text-sm text-slate-500">포트폴리오 성과 분석</p>
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

      {!hasData ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 shadow-sm">
          <div className="rounded-full bg-slate-100 p-4">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <p className="mt-3 text-slate-500">매수 기록이 없어 수익률을 계산할 수 없습니다.</p>
          <Link to="/settings" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline">
            포트폴리오 설정으로 이동
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
      ) : (
        <>
          {/* 히어로: 수익률 요약 */}
          <div className="overflow-hidden rounded-xl bg-slate-900 shadow-lg">
            <div className="px-5 py-5 sm:px-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">총 매수금액</p>
                  <p className="mt-1 tabular-nums text-lg font-semibold text-white">
                    {formatCurrency(ret.totalPurchaseKRW, 'KRW')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">총 평가금액</p>
                  <p className="mt-1 tabular-nums text-lg font-semibold text-white">
                    {formatCurrency(ret.totalMarketKRW, 'KRW')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">총 손익</p>
                  <p className={`mt-1 tabular-nums text-lg font-semibold ${ret.totalProfitLoss >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                    {formatPL(ret.totalProfitLoss)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">수익률</p>
                  <p className={`mt-1 tabular-nums text-2xl font-bold ${ret.totalReturnRate >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                    {formatPercent(ret.totalReturnRate)}
                  </p>
                  {ret.dailyProfitLoss !== 0 && (
                    <p className={`mt-0.5 tabular-nums text-xs ${ret.dailyProfitLoss >= 0 ? 'text-red-400/70' : 'text-blue-400/70'}`}>
                      오늘 {formatPL(ret.dailyProfitLoss)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400">* 장 종료 후 기준, USD 종목은 현재 환율로 KRW 환산</p>

          {/* 베스트 / 워스트 */}
          {allCompanies.length >= 2 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-red-50/50 px-4 py-2.5">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-red-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
                    Best
                  </h3>
                </div>
                <div className="divide-y divide-slate-50 px-4">
                  {best.map((c, i) => (
                    <div key={c.companyId} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">{i + 1}</span>
                        <span className="text-slate-700">{c.name}</span>
                      </span>
                      <ProfitColor value={c.returnRate}>
                        <span className="tabular-nums font-semibold">{formatPercent(c.returnRate)}</span>
                      </ProfitColor>
                    </div>
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-blue-50/50 px-4 py-2.5">
                  <h3 className="flex items-center gap-1.5 text-sm font-semibold text-blue-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" /></svg>
                    Worst
                  </h3>
                </div>
                <div className="divide-y divide-slate-50 px-4">
                  {worst.map((c, i) => (
                    <div key={c.companyId} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{i + 1}</span>
                        <span className="text-slate-700">{c.name}</span>
                      </span>
                      <ProfitColor value={c.returnRate}>
                        <span className="tabular-nums font-semibold">{formatPercent(c.returnRate)}</span>
                      </ProfitColor>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 섹터별 수익률 바 차트 */}
          {ret.sectors.filter((s) => s.companies.length > 0).length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
                <h2 className="text-sm font-semibold text-slate-900">섹터별 수익률</h2>
              </div>
              <div className="space-y-4 p-5">
                {ret.sectors
                  .filter((s) => s.companies.length > 0)
                  .map((sector) => {
                    const maxAbs = Math.max(
                      ...ret.sectors
                        .filter((s) => s.companies.length > 0)
                        .map((s) => Math.abs(s.returnRate)),
                      1,
                    );
                    const barWidth = Math.min(Math.abs(sector.returnRate) / maxAbs * 100, 100);
                    const isPositive = sector.returnRate >= 0;

                    return (
                      <div key={sector.sectorId}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500">
                              {sector.name.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-800">{sector.name}</span>
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="tabular-nums text-xs text-slate-400">
                              {formatCurrency(sector.marketValueKRW, 'KRW')}
                            </span>
                            <ProfitColor value={sector.returnRate}>
                              <span className="tabular-nums font-semibold">{formatPercent(sector.returnRate)}</span>
                            </ProfitColor>
                          </span>
                        </div>
                        <div className="ml-9 mt-1 flex h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isPositive ? 'bg-red-400' : 'bg-blue-400'
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 종목별 상세 테이블 */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">종목별 수익률</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-medium text-slate-400">
                    <th className="whitespace-nowrap px-3 py-2.5 sm:px-5">종목</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-right sm:px-5">보유수량</th>
                    <th className="hidden whitespace-nowrap px-3 py-2.5 text-right sm:table-cell sm:px-5">평균단가</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-right sm:px-5">현재가</th>
                    <th className="hidden whitespace-nowrap px-3 py-2.5 text-right sm:table-cell sm:px-5">평가금액</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-right sm:px-5">손익</th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-right sm:px-5">수익률</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c) => (
                    <tr key={c.companyId} className="border-b border-slate-50 transition-colors last:border-b-0 hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-3 sm:px-5">
                        <Link to={`/stock/${c.companyId}`} className="font-medium text-emerald-600 hover:underline">
                          {c.name}
                        </Link>
                        <span className="ml-1 font-mono text-xs text-slate-400">{c.ticker}</span>
                      </td>
                      <td className="whitespace-nowrap tabular-nums px-3 py-3 text-right text-slate-700 sm:px-5">{formatNumber(c.quantity)}주</td>
                      <td className="hidden whitespace-nowrap tabular-nums px-3 py-3 text-right text-slate-500 sm:table-cell sm:px-5">
                        {formatCurrency(c.avgPrice, c.currency)}
                      </td>
                      <td className="whitespace-nowrap tabular-nums px-3 py-3 text-right text-slate-700 sm:px-5">
                        {formatCurrency(c.currentPrice, c.currency)}
                      </td>
                      <td className="hidden whitespace-nowrap tabular-nums px-3 py-3 text-right text-slate-700 sm:table-cell sm:px-5">
                        {formatCurrency(c.marketValue, c.currency)}
                      </td>
                      <td className="whitespace-nowrap tabular-nums px-3 py-3 text-right sm:px-5">
                        <ProfitColor value={c.profitLoss}>
                          {c.profitLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(c.profitLoss), c.currency)}
                        </ProfitColor>
                      </td>
                      <td className="whitespace-nowrap tabular-nums px-3 py-3 text-right font-semibold sm:px-5">
                        <ProfitColor value={c.returnRate}>
                          {formatPercent(c.returnRate)}
                        </ProfitColor>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
