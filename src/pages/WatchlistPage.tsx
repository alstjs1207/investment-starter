import { useState } from 'react';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { useMarketStore } from '@/stores/marketStore';
import { calculateEntryZone } from '@/utils/calc';
import WatchlistForm from '@/components/WatchlistForm';
import WatchlistItemRow from '@/components/WatchlistItemRow';

export default function WatchlistPage() {
  const { items } = useWatchlistStore();
  const { quotes, loading, fetchAllQuotes } = useMarketStore();
  const [showForm, setShowForm] = useState(false);

  const entryOkCount = items.filter((item) => {
    const quote = quotes[item.ticker];
    return calculateEntryZone(quote?.price, item.buyZoneLower, item.buyZoneUpper).status === 'entry_ok';
  }).length;

  const handleFetchQuotes = () => {
    const stocks = items.map((it) => ({ ticker: it.ticker, market: it.market }));
    if (stocks.length > 0) fetchAllQuotes(stocks);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">워치리스트</h1>
          <p className="text-sm text-slate-500">
            {items.length}개 종목
            {entryOkCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                진입가능 {entryOkCount}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFetchQuotes}
            disabled={loading || items.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            )}
            시세 조회
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            + 종목 추가
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">새 종목</p>
          <WatchlistForm onDone={() => setShowForm(false)} />
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center">
          <p className="text-sm text-slate-400">관심 종목을 추가해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <WatchlistItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
