import { Link } from 'react-router-dom';
import type { SectorWeight } from '@/utils/calc';
import { formatCurrency } from '@/utils/calc';
import DeviationBadge from './DeviationBadge';

interface StockQuote {
  price: number;
  currency: 'KRW' | 'USD';
  change: number;
  changePercent: number;
}

interface Props {
  sectors: SectorWeight[];
  quotes?: Record<string, StockQuote>;
}

export default function WeightTable({ sectors, quotes = {} }: Props) {
  if (sectors.length === 0) return null;

  return (
    <div className="space-y-4">
      {sectors.map((sector) => {
        const purchaseMet = sector.purchaseStatus === 'normal' || sector.purchaseStatus === 'over';
        return (
        <div
          key={sector.sectorId}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          {/* Sector header */}
          <div className={`border-b px-4 py-4 sm:px-5 ${purchaseMet ? 'bg-emerald-50/50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${
                  purchaseMet
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {sector.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{sector.name}</h3>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                    <span>{sector.companies.length}개 종목</span>
                    <span>·</span>
                    <span className="tabular-nums">목표 {sector.targetWeight}%</span>
                  </div>
                </div>
              </div>
              {purchaseMet && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  목표 달성
                </span>
              )}
            </div>

            {/* 목표 대비 프로그레스 바 */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">매수 기준</span>
                  <span className="flex items-center gap-1.5">
                    <span className="tabular-nums font-medium text-slate-700">{sector.purchaseWeight.toFixed(1)}%</span>
                    <DeviationBadge status={sector.purchaseStatus} diff={sector.purchaseDiff} />
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sector.purchaseStatus === 'over' ? 'bg-rose-400' :
                      sector.purchaseStatus === 'normal' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min((sector.purchaseWeight / Math.max(sector.targetWeight, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">시가 기준</span>
                  <span className="flex items-center gap-1.5">
                    <span className="tabular-nums font-medium text-slate-700">{sector.marketWeight.toFixed(1)}%</span>
                    <DeviationBadge status={sector.marketStatus} diff={sector.marketDiff} />
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sector.marketStatus === 'over' ? 'bg-rose-400' :
                      sector.marketStatus === 'normal' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min((sector.marketWeight / Math.max(sector.targetWeight, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 금액 요약 */}
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span>매수</span>
                {sector.purchaseAmountKRW > 0 && (
                  <span className="tabular-nums text-slate-500">{formatCurrency(sector.purchaseAmountKRW, 'KRW')}</span>
                )}
                {sector.purchaseAmountUSD > 0 && (
                  <span className="tabular-nums text-slate-500">{formatCurrency(sector.purchaseAmountUSD, 'USD')}</span>
                )}
                {sector.purchaseAmountKRW === 0 && sector.purchaseAmountUSD === 0 && (
                  <span className="text-slate-300">—</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span>시가</span>
                {sector.marketValueKRW > 0 && (
                  <span className="tabular-nums text-slate-500">{formatCurrency(sector.marketValueKRW, 'KRW')}</span>
                )}
                {sector.marketValueUSD > 0 && (
                  <span className="tabular-nums text-slate-500">{formatCurrency(sector.marketValueUSD, 'USD')}</span>
                )}
                {sector.marketValueKRW === 0 && sector.marketValueUSD === 0 && (
                  <span className="text-slate-300">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Company rows */}
          {sector.companies.length > 0 && (
            <div className="divide-y divide-slate-100">
              {sector.companies.map((company) => {
                const currency = company.market === 'KRX' ? 'KRW' as const : 'USD' as const;
                const quote = quotes[company.ticker];
                return (
                  <Link
                    key={company.companyId}
                    to={`/stock/${company.companyId}`}
                    className="group block px-4 py-3 transition-colors hover:bg-slate-50 sm:px-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-medium text-slate-500 group-hover:bg-slate-200">
                          {company.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-slate-800">{company.name}</span>
                            <span className="font-mono text-xs text-slate-400">{company.ticker}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {quote && (
                          <div className="text-right">
                            <p className="tabular-nums text-sm font-medium text-slate-700">{formatCurrency(quote.price, currency)}</p>
                            <p className={`tabular-nums text-xs font-medium ${quote.changePercent >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                              {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                            </p>
                          </div>
                        )}
                        {!quote && company.marketValue > 0 && (
                          <span className="tabular-nums text-sm text-slate-400">
                            {formatCurrency(company.marketValue, currency)}
                          </span>
                        )}
                        <svg className="h-4 w-4 text-slate-300 group-hover:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                    {/* 비중 정보 */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 pl-10 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">목표</span>
                        <span className="tabular-nums font-medium text-slate-600">{company.targetWeight}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">매수</span>
                        <span className="tabular-nums font-medium text-slate-600">{company.purchaseWeight.toFixed(1)}%</span>
                        <DeviationBadge status={company.purchaseStatus} diff={company.purchaseDiff} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">시가</span>
                        <span className="tabular-nums font-medium text-slate-600">{company.marketWeight.toFixed(1)}%</span>
                        <DeviationBadge status={company.marketStatus} diff={company.marketDiff} />
                      </div>
                      {company.marketValue > 0 && (
                        <span className="tabular-nums hidden text-slate-400 sm:inline">
                          {formatCurrency(company.marketValue, currency)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
}
