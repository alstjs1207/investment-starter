import { useParams, Link } from 'react-router-dom';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useMarketStore } from '@/stores/marketStore';
import {
  getCompanyBudget,
  getTotalPurchaseAmount,
  getTotalQuantity,
  getBuyableQuantity,
  calculateWeights,
  formatCurrency,
  formatNumber,
} from '@/utils/calc';
import DeviationBadge from '@/components/DeviationBadge';
import PurchaseForm from '@/components/PurchaseForm';

function MarketBadge({ market }: { market: string }) {
  const colors: Record<string, string> = {
    KRX: 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
    NYSE: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/20',
    NASDAQ: 'bg-purple-500/15 text-purple-400 ring-purple-500/20',
  };
  const c = colors[market] ?? 'bg-slate-500/15 text-slate-400 ring-slate-500/20';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${c}`}>
      {market}
    </span>
  );
}

export default function StockDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { portfolio } = usePortfolioStore();
  const { quotes, exchangeRate, loading, fetchQuote, fetchRate } = useMarketStore();

  let foundSector = null;
  let foundCompany = null;
  for (const sector of portfolio.sectors) {
    const company = sector.companies.find((c) => c.id === companyId);
    if (company) {
      foundSector = sector;
      foundCompany = company;
      break;
    }
  }

  if (!foundSector || !foundCompany) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-slate-100 p-4">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <p className="mt-3 text-slate-500">종목을 찾을 수 없습니다.</p>
        <Link to="/settings" className="mt-2 inline-block text-sm text-emerald-600 hover:underline">
          설정으로 이동
        </Link>
      </div>
    );
  }

  const currency = foundCompany.market === 'KRX' ? ('KRW' as const) : ('USD' as const);
  const budget = getCompanyBudget(portfolio, foundSector, foundCompany);
  const purchaseTotal = getTotalPurchaseAmount(foundCompany);
  const quantity = getTotalQuantity(foundCompany);
  const quote = quotes[foundCompany.ticker];
  const rate = exchangeRate ?? 1300;
  const budgetInCurrency = currency === 'KRW' ? budget : budget / rate;
  const buyable = quote ? getBuyableQuantity(budgetInCurrency, quote.price, purchaseTotal) : null;
  const marketValue = quote ? quote.price * quantity : null;

  return (
    <div className="space-y-5">
      {/* 히어로 헤더 */}
      <div className="overflow-hidden rounded-xl bg-slate-900 shadow-lg">
        <div className="px-5 py-5 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            홈
          </Link>
          <div className="mt-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{foundCompany.name}</h1>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    foundCompany.purchased
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {foundCompany.purchased ? '보유중' : '미매수'}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-slate-300">{foundCompany.ticker}</span>
                <MarketBadge market={foundCompany.market} />
                <span className="text-sm text-slate-500">{foundSector.name} 섹터</span>
              </div>
            </div>
            <button
              onClick={() => { fetchQuote(foundCompany.ticker, foundCompany.market); fetchRate(); }}
              disabled={loading}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 disabled:opacity-50"
            >
              {loading ? '조회 중...' : '시세 조회'}
            </button>
          </div>

          {/* 현재가 영역 - 헤더에 통합 */}
          {quote ? (
            <div className="mt-4 border-t border-slate-700/50 pt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">현재가</p>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="tabular-nums text-3xl font-bold text-white">
                  {formatCurrency(quote.price, currency)}
                </span>
                <span
                  className={`tabular-nums text-sm font-semibold ${
                    quote.change >= 0 ? 'text-red-400' : 'text-blue-400'
                  }`}
                >
                  {quote.change >= 0 ? '+' : ''}
                  {formatCurrency(Math.abs(quote.change), currency)}
                  {' '}
                  ({quote.change >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                {exchangeRate && (
                  <span>
                    환산:{' '}
                    {currency === 'KRW'
                      ? `$${formatNumber(quote.price / exchangeRate, 2)}`
                      : `${formatNumber(quote.price * exchangeRate)}원`}
                  </span>
                )}
                <span>{new Date(quote.updatedAt).toLocaleString('ko-KR')}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-800/50 px-4 py-3">
              <svg className="h-5 w-5 shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <p className="text-sm text-slate-500">시세 조회를 눌러 현재가를 불러오세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 핵심 지표 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-slate-500">배정 금액</p>
          </div>
          <p className="mt-2 tabular-nums text-lg font-bold text-slate-900">{formatCurrency(budget, 'KRW')}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-slate-500">매수 총액</p>
          </div>
          <p className="mt-2 tabular-nums text-lg font-bold text-slate-900">
            {purchaseTotal > 0 ? formatCurrency(purchaseTotal, currency) : '-'}
          </p>
          {purchaseTotal > 0 && currency === 'USD' && exchangeRate && (
            <p className="mt-0.5 tabular-nums text-xs text-slate-400">
              ≈ {formatNumber(Math.round(purchaseTotal * exchangeRate))}원
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
            <p className="text-xs font-medium text-slate-500">보유 수량</p>
          </div>
          <p className="mt-2 tabular-nums text-lg font-bold text-slate-900">
            {quantity > 0 ? `${formatNumber(quantity)}주` : '-'}
          </p>
        </div>
        {quote && buyable !== null ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-500">매수 가능</p>
            </div>
            <p className="mt-2 tabular-nums text-lg font-bold text-slate-900">{formatNumber(buyable)}주</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-400">매수 가능</p>
            </div>
            <p className="mt-2 text-lg font-bold text-slate-300">-</p>
          </div>
        )}
      </div>

      {/* 평가금액 (시세 있을 때만) */}
      {quote && marketValue !== null && quantity > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-700">현재 평가금액</p>
              <p className="mt-1 tabular-nums text-2xl font-bold text-emerald-900">
                {formatCurrency(marketValue, currency)}
              </p>
            </div>
            {purchaseTotal > 0 && (
              <div className="text-right">
                <p className="text-xs font-medium text-emerald-700">평가 손익</p>
                {(() => {
                  const pnl = marketValue - purchaseTotal;
                  const pnlRate = (pnl / purchaseTotal) * 100;
                  return (
                    <p className={`mt-1 tabular-nums text-lg font-bold ${pnl >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {pnl >= 0 ? '+' : ''}{formatCurrency(Math.round(pnl), currency)}
                      <span className="ml-1.5 text-sm font-semibold">
                        ({pnl >= 0 ? '+' : ''}{pnlRate.toFixed(2)}%)
                      </span>
                    </p>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 비중 비교 */}
      {(() => {
        const weights = calculateWeights(portfolio, quotes, exchangeRate);
        const sw = weights.find((s) => s.sectorId === foundSector.id);
        const cw = sw?.companies.find((c) => c.companyId === foundCompany.id);
        if (!cw) return null;
        return (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-900">비중 비교</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-400">구분</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-400">목표</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-400">매수 기준</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-slate-400">시가 기준</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-700">섹터 내 비중</td>
                    <td className="tabular-nums px-5 py-3 text-right font-medium text-slate-900">{cw.targetWeight}%</td>
                    <td className="px-5 py-3 text-right">
                      <span className="tabular-nums font-medium">{cw.purchaseWeight.toFixed(1)}%</span>
                      <span className="ml-1.5">
                        <DeviationBadge status={cw.purchaseStatus} diff={cw.purchaseDiff} />
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="tabular-nums font-medium">{cw.marketWeight.toFixed(1)}%</span>
                      <span className="ml-1.5">
                        <DeviationBadge status={cw.marketStatus} diff={cw.marketDiff} />
                      </span>
                    </td>
                  </tr>
                  {sw && (
                    <tr>
                      <td className="px-5 py-3 font-medium text-slate-700">포트폴리오 내 섹터</td>
                      <td className="tabular-nums px-5 py-3 text-right font-medium text-slate-900">{sw.targetWeight}%</td>
                      <td className="px-5 py-3 text-right">
                        <span className="tabular-nums font-medium">{sw.purchaseWeight.toFixed(1)}%</span>
                        <span className="ml-1.5">
                          <DeviationBadge status={sw.purchaseStatus} diff={sw.purchaseDiff} />
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="tabular-nums font-medium">{sw.marketWeight.toFixed(1)}%</span>
                        <span className="ml-1.5">
                          <DeviationBadge status={sw.marketStatus} diff={sw.marketDiff} />
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* 거래 기록 */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">거래 기록</h2>
        </div>
        <div className="p-5">
          <PurchaseForm
            sectorId={foundSector.id}
            companyId={foundCompany.id}
            company={foundCompany}
            defaultCurrency={currency}
            purchases={foundCompany.purchases}
          />
        </div>
      </div>
    </div>
  );
}
