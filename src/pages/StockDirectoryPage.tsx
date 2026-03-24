import { useState } from 'react';
import { STOCKS, STOCK_SECTORS as SECTORS } from '@/data/stocks';

function MarketBadge({ market }: { market: string }) {
  const colors: Record<string, string> = {
    KRX: 'bg-blue-500/15 text-blue-700 ring-blue-500/20',
    NYSE: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/20',
    NASDAQ: 'bg-purple-500/15 text-purple-700 ring-purple-500/20',
  };
  const c = colors[market] ?? 'bg-slate-500/15 text-slate-700 ring-slate-500/20';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${c}`}>
      {market}
    </span>
  );
}

export default function StockDirectoryPage() {
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState<string>('');

  const filtered = STOCKS.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q);
    const matchSector = !filterSector || s.sector === filterSector;
    return matchSearch && matchSector;
  });

  return (
    <div className="space-y-5">
      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">종목 사전</h1>
          <p className="text-sm text-slate-500">대표 종목의 이름, 티커, 상장 정보를 확인하세요.</p>
        </div>
      </div>

      {/* 검색 & 필터 */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="종목명 또는 티커 검색"
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <select
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="">전체 섹터</option>
          {SECTORS.map((sec) => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>
      </div>

      {/* 결과 수 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {search || filterSector ? '검색 결과 ' : '총 '}
          <span className="tabular-nums font-semibold text-slate-600">{filtered.length}</span>개 종목
        </p>
      </div>

      {/* 테이블 */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-left text-xs font-medium text-slate-500">
              <tr>
                <th className="px-5 py-3">종목명</th>
                <th className="px-5 py-3">티커</th>
                <th className="px-5 py-3">상장</th>
                <th className="hidden px-5 py-3 sm:table-cell">섹터</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((stock) => (
                <tr key={stock.ticker} className="transition-colors hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-medium text-slate-500">
                        {stock.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-800">{stock.name}</span>
                        <span className="ml-1.5 text-xs text-slate-400 sm:hidden">{stock.sector}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-600">{stock.ticker}</td>
                  <td className="px-5 py-3">
                    <MarketBadge market={stock.market} />
                  </td>
                  <td className="hidden px-5 py-3 text-slate-500 sm:table-cell">{stock.sector}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                      <p className="mt-2 text-slate-400">검색 결과가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
