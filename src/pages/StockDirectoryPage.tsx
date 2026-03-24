import { useState, useRef } from 'react';
import { STOCKS, STOCK_SECTORS as DEFAULT_SECTORS, parseStockJson } from '@/data/stocks';
import { useStockDirectoryStore } from '@/stores/stockDirectoryStore';

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const { customStocks, addStocks, removeStock, clearCustomStocks } = useStockDirectoryStore();

  // 기본 종목 + 커스텀 종목 합치기
  const allStocks = [...STOCKS, ...customStocks];
  const allSectors = [...new Set([...DEFAULT_SECTORS, ...customStocks.map((s) => s.sector)])];
  const customTickers = new Set(customStocks.map((s) => s.ticker));

  const filtered = allStocks.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q);
    const matchSector = !filterSector || s.sector === filterSector;
    return matchSearch && matchSector;
  });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      const { stocks, errors } = parseStockJson(raw);

      if (errors.length > 0) {
        setImportErrors(errors);
      }

      if (stocks.length === 0) {
        showMessage('error', '추가할 수 있는 종목이 없습니다.');
        return;
      }

      const { added, skipped } = addStocks(stocks);
      if (added > 0) {
        showMessage('success', `${added}개 종목을 추가했습니다.${skipped > 0 ? ` (중복 ${skipped}개 제외)` : ''}`);
      } else {
        showMessage('error', '모든 종목이 이미 존재합니다.');
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleExportTemplate = () => {
    const template = JSON.stringify(
      [
        { name: '종목이름', ticker: 'TICKER', market: 'NYSE', sector: '섹터명' },
      ],
      null,
      2,
    );
    const blob = new Blob([template], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

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

      {/* JSON 일괄 추가 */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-slate-900">종목 일괄 추가</h2>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-500">
            JSON 파일로 종목을 한번에 추가할 수 있습니다. 형식: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">[{`{ "name", "ticker", "market", "sector" }`}]</code>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              JSON 파일 가져오기
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExportTemplate}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              템플릿 다운로드
            </button>
            {customStocks.length > 0 && (
              <button
                onClick={() => {
                  clearCustomStocks();
                  showMessage('success', '커스텀 종목을 모두 삭제했습니다.');
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                커스텀 종목 전체 삭제
              </button>
            )}
          </div>
          {message && (
            <div className={`mt-3 flex items-center gap-1.5 text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {message.type === 'success' ? (
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              ) : (
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
              {message.text}
            </div>
          )}
          {importErrors.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-800">일부 항목에 문제가 있습니다:</p>
              <ul className="mt-1 space-y-0.5">
                {importErrors.map((err, i) => (
                  <li key={i} className="text-xs text-amber-700">{err}</li>
                ))}
              </ul>
            </div>
          )}
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
          {allSectors.map((sec) => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>
      </div>

      {/* 결과 수 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {search || filterSector ? '검색 결과 ' : '총 '}
          <span className="tabular-nums font-semibold text-slate-600">{filtered.length}</span>개 종목
          {customStocks.length > 0 && (
            <span className="ml-1.5 text-slate-300">(커스텀 {customStocks.length}개 포함)</span>
          )}
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
                <th className="w-10 px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((stock) => {
                const isCustom = customTickers.has(stock.ticker);
                return (
                  <tr key={stock.ticker} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium ${isCustom ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {stock.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-medium text-slate-800">{stock.name}</span>
                          {isCustom && (
                            <span className="ml-1.5 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200">
                              커스텀
                            </span>
                          )}
                          <span className="ml-1.5 text-xs text-slate-400 sm:hidden">{stock.sector}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600">{stock.ticker}</td>
                    <td className="px-5 py-3">
                      <MarketBadge market={stock.market} />
                    </td>
                    <td className="hidden px-5 py-3 text-slate-500 sm:table-cell">{stock.sector}</td>
                    <td className="px-3 py-3">
                      {isCustom && (
                        <button
                          onClick={() => removeStock(stock.ticker)}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                          title="삭제"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
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
