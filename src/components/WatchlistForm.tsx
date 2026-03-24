import { useState, useRef } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { STOCKS } from '@/data/stocks';
import type { WatchlistItem } from '@/types';

interface Props {
  editItem?: WatchlistItem;
  onDone: () => void;
}

export default function WatchlistForm({ editItem, onDone }: Props) {
  const { portfolio } = usePortfolioStore();
  const { addItem, updateItem } = useWatchlistStore();

  const [name, setName] = useState(editItem?.name ?? '');
  const [ticker, setTicker] = useState(editItem?.ticker ?? '');
  const [market, setMarket] = useState<WatchlistItem['market']>(editItem?.market ?? 'KRX');
  const [targetSectorId, setTargetSectorId] = useState(editItem?.targetSectorId ?? (portfolio.sectors[0]?.id ?? ''));
  const [targetWeight, setTargetWeight] = useState(editItem?.targetWeight?.toString() ?? '');
  const [buyZoneLower, setBuyZoneLower] = useState(editItem?.buyZoneLower?.toString() ?? '');
  const [buyZoneUpper, setBuyZoneUpper] = useState(editItem?.buyZoneUpper?.toString() ?? '');

  const [suggestions, setSuggestions] = useState<typeof STOCKS>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (value.trim().length > 0) {
      const q = value.trim().toLowerCase();
      const matched = STOCKS.filter(
        (s) => s.name.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q),
      );
      setSuggestions(matched);
      setShowSuggestions(matched.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectStock = (stock: (typeof STOCKS)[number]) => {
    setName(stock.name);
    setTicker(stock.ticker);
    setMarket(stock.market);
    setShowSuggestions(false);
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const trimmedTicker = ticker.trim();
    const weight = Number(targetWeight);
    if (!trimmedName || !trimmedTicker || !targetSectorId || !weight || weight <= 0) return;

    const lower = buyZoneLower ? Number(buyZoneLower) : undefined;
    const upper = buyZoneUpper ? Number(buyZoneUpper) : undefined;

    if (editItem) {
      updateItem(editItem.id, {
        name: trimmedName,
        ticker: trimmedTicker,
        market,
        targetSectorId,
        targetWeight: weight,
        buyZoneLower: lower,
        buyZoneUpper: upper,
      });
    } else {
      addItem({
        name: trimmedName,
        ticker: trimmedTicker,
        market,
        targetSectorId,
        targetWeight: weight,
        buyZoneLower: lower,
        buyZoneUpper: upper,
      });
    }
    onDone();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="relative col-span-2 sm:col-span-1">
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => name.trim() && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="종목명 *"
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
          {showSuggestions && (
            <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg sm:w-64">
              {suggestions.map((stock) => (
                <li key={stock.ticker}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectStock(stock)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-emerald-50"
                  >
                    <span>{stock.name}</span>
                    <span className="font-mono text-xs text-slate-400">{stock.ticker} · {stock.market}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="티커 *"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
        <select
          value={market}
          onChange={(e) => setMarket(e.target.value as WatchlistItem['market'])}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="KRX">KRX</option>
          <option value="NYSE">NYSE</option>
          <option value="NASDAQ">NASDAQ</option>
        </select>
        <select
          value={targetSectorId}
          onChange={(e) => setTargetSectorId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="">편입 섹터 *</option>
          {portfolio.sectors.map((sec) => (
            <option key={sec.id} value={sec.id}>{sec.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="비중 *"
            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right text-sm tabular-nums focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          />
          <span className="text-sm text-slate-500">%</span>
        </div>
        <input
          type="number"
          value={buyZoneLower}
          onChange={(e) => setBuyZoneLower(e.target.value)}
          placeholder="매수 하단가"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right text-sm tabular-nums focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
        <input
          type="number"
          value={buyZoneUpper}
          onChange={(e) => setBuyZoneUpper(e.target.value)}
          placeholder="매수 상단가"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right text-sm tabular-nums focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          {editItem ? '저장' : '추가'}
        </button>
        <button
          onClick={onDone}
          className="rounded-lg px-4 py-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          취소
        </button>
      </div>
    </div>
  );
}
