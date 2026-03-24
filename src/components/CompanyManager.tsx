import { useState, useRef } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import {
  validateCompanyWeights,
  getCompanyBudget,
  getTotalPurchaseAmount,
  getTotalQuantity,
  formatCurrency,
} from '@/utils/calc';
import type { Company } from '@/types';
import PurchaseForm from './PurchaseForm';
import { STOCKS } from '@/data/stocks';
import { useStockDirectoryStore } from '@/stores/stockDirectoryStore';

interface Props {
  sectorId: string;
}

export default function CompanyManager({ sectorId }: Props) {
  const { portfolio, addCompany, updateCompany, deleteCompany } = usePortfolioStore();
  const { customStocks } = useStockDirectoryStore();
  const sector = portfolio.sectors.find((s) => s.id === sectorId);

  const allStocks = [...STOCKS, ...customStocks];

  const [newName, setNewName] = useState('');
  const [newTicker, setNewTicker] = useState('');
  const [newMarket, setNewMarket] = useState<Company['market']>('KRX');
  const [newWeight, setNewWeight] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({ name: '', ticker: '', market: 'KRX' as Company['market'], weight: '' });
  const [purchaseCompanyId, setPurchaseCompanyId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<typeof STOCKS>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (value: string) => {
    setNewName(value);
    if (value.trim().length > 0) {
      const q = value.trim().toLowerCase();
      const matched = allStocks.filter(
        (s) => s.name.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q),
      );
      setSuggestions(matched);
      setShowSuggestions(matched.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectStock = (stock: typeof STOCKS[number]) => {
    setNewName(stock.name);
    setNewTicker(stock.ticker);
    setNewMarket(stock.market);
    setShowSuggestions(false);
  };

  if (!sector) return null;

  const validation = validateCompanyWeights(sector);

  const handleAdd = () => {
    const name = newName.trim();
    const ticker = newTicker.trim();
    const weight = Number(newWeight);
    if (!name || !weight || weight <= 0) return;
    addCompany(sectorId, { name, ticker: ticker || undefined, market: newMarket, targetWeight: weight });
    setNewName('');
    setNewTicker('');
    setNewWeight('');
    setShowSuggestions(false);
  };

  const handleStartEdit = (company: Company) => {
    setEditingId(company.id);
    setEditFields({
      name: company.name,
      ticker: company.ticker,
      market: company.market,
      weight: String(company.targetWeight),
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateCompany(sectorId, editingId, {
      name: editFields.name.trim(),
      ticker: editFields.ticker.trim(),
      market: editFields.market,
      targetWeight: Number(editFields.weight),
    });
    setEditingId(null);
  };

  const getCurrency = (market: Company['market']) => (market === 'KRX' ? 'KRW' as const : 'USD' as const);

  return (
    <div>
      {!validation.isValid && sector.companies.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <svg className="h-3.5 w-3.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-amber-800">
            기업 비중 합계: <span className="tabular-nums font-semibold">{validation.total}%</span> / {sector.targetWeight}%
            {validation.diff > 0
              ? <span className="text-rose-600"> — {validation.diff}%p 초과</span>
              : <span> — {Math.abs(validation.diff)}%p 미배분</span>}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {sector.companies.map((company) => {
          const currency = getCurrency(company.market);
          const budget = getCompanyBudget(portfolio, sector, company);
          const purchaseTotal = getTotalPurchaseAmount(company);
          const quantity = getTotalQuantity(company);

          return (
            <div key={company.id} className="rounded-lg border border-slate-200 bg-white">
              {editingId === company.id ? (
                <div className="space-y-2 p-3">
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                    <input
                      value={editFields.name}
                      onChange={(e) => setEditFields({ ...editFields, name: e.target.value })}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none sm:flex-1"
                      placeholder="종목명"
                    />
                    <input
                      value={editFields.ticker}
                      onChange={(e) => setEditFields({ ...editFields, ticker: e.target.value })}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none sm:w-28"
                      placeholder="티커"
                    />
                    <select
                      value={editFields.market}
                      onChange={(e) => setEditFields({ ...editFields, market: e.target.value as Company['market'] })}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="KRX">KRX</option>
                      <option value="NYSE">NYSE</option>
                      <option value="NASDAQ">NASDAQ</option>
                    </select>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editFields.weight}
                        onChange={(e) => setEditFields({ ...editFields, weight: e.target.value })}
                        className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm tabular-nums focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="text-sm text-slate-500">%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">저장</button>
                    <button onClick={() => setEditingId(null)} className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700">취소</button>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 sm:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-medium text-slate-500">
                        {company.name.charAt(0)}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium text-slate-800">{company.name}</span>
                        <span className="font-mono text-xs text-slate-400">
                          {company.ticker ? `${company.ticker} · ` : ''}{company.market}
                        </span>
                        <span
                          className={`inline-block rounded-full px-1.5 py-0.5 text-xs font-medium ${
                            company.purchased
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {company.purchased ? '보유중' : '미매수'}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums text-sm font-semibold text-emerald-600">
                        {company.targetWeight}%
                      </span>
                      <button onClick={() => handleStartEdit(company)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button onClick={() => deleteCompany(sectorId, company.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 ml-9 grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <div>
                      <span className="block text-slate-400">배정 금액</span>
                      <span className="tabular-nums">{formatCurrency(budget, 'KRW')}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">매수 총액</span>
                      <span className="tabular-nums">{purchaseTotal > 0 ? formatCurrency(purchaseTotal, currency) : '-'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">보유 수량</span>
                      <span className="tabular-nums">{quantity > 0 ? `${quantity}주` : '-'}</span>
                    </div>
                  </div>

                  <div className="mt-2 ml-9">
                    <button
                      onClick={() => setPurchaseCompanyId(purchaseCompanyId === company.id ? null : company.id)}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      {purchaseCompanyId === company.id ? '닫기' : '매수 기록'}
                    </button>
                  </div>

                  {purchaseCompanyId === company.id && (
                    <div className="mt-3 ml-9 border-t border-slate-100 pt-3">
                      <PurchaseForm
                        sectorId={sectorId}
                        companyId={company.id}
                        company={company}
                        defaultCurrency={currency}
                        purchases={company.purchases}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 기업 추가 폼 */}
      <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white/50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">종목 추가</p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="relative">
            <input
              ref={nameInputRef}
              value={newName}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => newName.trim() && suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="종목명"
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none sm:flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
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
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            placeholder="티커"
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none sm:w-24"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <select
            value={newMarket}
            onChange={(e) => setNewMarket(e.target.value as Company['market'])}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="KRX">KRX</option>
            <option value="NYSE">NYSE</option>
            <option value="NASDAQ">NASDAQ</option>
          </select>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="%"
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-right text-sm tabular-nums focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none sm:w-16"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <span className="text-sm text-slate-500">%</span>
            <button
              onClick={handleAdd}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
