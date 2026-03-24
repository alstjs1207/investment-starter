import { useState, useEffect } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { formatNumber } from '@/utils/calc';

export default function BudgetForm() {
  const { portfolio, setBudget } = usePortfolioStore();
  const [budget, setBudgetLocal] = useState(portfolio.totalBudget);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBudgetLocal(portfolio.totalBudget);
  }, [portfolio.totalBudget]);

  const handleSave = () => {
    setBudget(budget);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-slate-900">투자 예산 설정</h2>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <label className="shrink-0 text-sm font-medium text-slate-700">전체 예산</label>
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-sm">
            <input
              type="text"
              inputMode="numeric"
              value={budget === 0 ? '' : formatNumber(budget)}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '');
                setBudgetLocal(v ? Number(v) : 0);
              }}
              placeholder="10,000,000"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-right tabular-nums text-lg font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="shrink-0 text-sm font-medium text-slate-500">원</span>
          </div>
          <button
            onClick={handleSave}
            className="shrink-0 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            저장
          </button>
          {saved && (
            <span className="flex shrink-0 items-center gap-1 text-sm text-emerald-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              저장됨
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
