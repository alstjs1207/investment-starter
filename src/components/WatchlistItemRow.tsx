import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { WatchlistItem } from '@/types';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { useMarketStore } from '@/stores/marketStore';
import { calculateEntryZone, formatNumber } from '@/utils/calc';
import EntryZoneBadge from './EntryZoneBadge';
import WatchlistForm from './WatchlistForm';

interface Props {
  item: WatchlistItem;
}

export default function WatchlistItemRow({ item }: Props) {
  const { portfolio, addCompany } = usePortfolioStore();
  const deleteItem = useWatchlistStore((s) => s.deleteItem);
  const quotes = useMarketStore((s) => s.quotes);
  const [editing, setEditing] = useState(false);

  const quote = quotes[item.ticker];
  const entryZone = calculateEntryZone(quote?.price, item.buyZoneLower, item.buyZoneUpper);
  const sector = portfolio.sectors.find((s) => s.id === item.targetSectorId);
  const isEntryOk = entryZone.status === 'entry_ok';
  const currency = item.market === 'KRX' ? 'KRW' : 'USD';

  const matchedCompany = portfolio.sectors
    .flatMap((s) => s.companies)
    .find((c) => c.ticker === item.ticker);
  const isDuplicate = !!matchedCompany;

  const handleConvert = () => {
    if (isDuplicate) return;
    addCompany(item.targetSectorId, {
      name: item.name,
      ticker: item.ticker,
      market: item.market,
      targetWeight: item.targetWeight,
    });
  };

  if (editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <WatchlistForm editItem={item} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={`rounded-xl border shadow-sm ${isEntryOk ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium ${isEntryOk ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {item.name.charAt(0)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium text-slate-800">{item.name}</span>
              <span className="font-mono text-xs text-slate-400">{item.ticker} · {item.market}</span>
              <EntryZoneBadge result={entryZone} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="tabular-nums text-sm font-semibold text-emerald-600">{item.targetWeight}%</span>
            <button onClick={() => setEditing(true)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
            </button>
            <button onClick={() => deleteItem(item.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-2 ml-9 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-4">
          <div>
            <span className="block text-slate-400">편입 섹터</span>
            <span>{sector ? sector.name : <span className="text-amber-600">섹터 삭제됨</span>}</span>
          </div>
          <div>
            <span className="block text-slate-400">현재가</span>
            <span className="tabular-nums">{quote ? formatNumber(quote.price, currency === 'USD' ? 2 : 0) : '-'}</span>
          </div>
          <div>
            <span className="block text-slate-400">매수 구간</span>
            <span className="tabular-nums">
              {item.buyZoneLower != null && item.buyZoneUpper != null
                ? `${formatNumber(item.buyZoneLower)} ~ ${formatNumber(item.buyZoneUpper)}`
                : '미설정'}
            </span>
          </div>
          <div>
            <span className="block text-slate-400">등록일</span>
            <span>{item.createdAt.slice(0, 10)}</span>
          </div>
        </div>

        <div className="mt-3 ml-9 flex items-center gap-2">
          {isDuplicate ? (
            <>
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-400">
                편입됨
              </span>
              <Link
                to={`/stock/${matchedCompany!.id}`}
                className="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100"
              >
                종목 상세로 이동
              </Link>
            </>
          ) : (
            <button
              onClick={handleConvert}
              disabled={!sector}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              포트폴리오 편입
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
