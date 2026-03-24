import { useState } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useMarketStore } from '@/stores/marketStore';
import { formatCurrency, formatNumber, getTotalQuantity } from '@/utils/calc';
import type { Purchase, Company } from '@/types';

interface Props {
  sectorId: string;
  companyId: string;
  company: Company;
  defaultCurrency: 'KRW' | 'USD';
  purchases: Purchase[];
}

export default function PurchaseForm({ sectorId, companyId, company, defaultCurrency, purchases }: Props) {
  const { addPurchase, deletePurchase } = usePortfolioStore();
  const { exchangeRate } = useMarketStore();
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  const currentQty = getTotalQuantity(company);

  const handleAdd = () => {
    const qty = Number(quantity);
    const prc = Number(price);
    if (!qty || qty <= 0 || !prc || prc <= 0) return;
    if (type === 'sell' && qty > currentQty) return;

    addPurchase(sectorId, companyId, {
      type,
      date,
      quantity: qty,
      pricePerShare: prc,
      currency: defaultCurrency,
      exchangeRate: defaultCurrency === 'USD' ? (exchangeRate ?? undefined) : undefined,
    });
    setQuantity('');
    setPrice('');
  };

  const sorted = [...purchases].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      {/* 거래 내역 */}
      {sorted.length > 0 && (
        <div>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-500">
                    <th className="whitespace-nowrap px-2 py-2 font-medium sm:px-3">날짜</th>
                    <th className="whitespace-nowrap px-2 py-2 font-medium sm:px-3">유형</th>
                    <th className="whitespace-nowrap px-2 py-2 text-right font-medium sm:px-3">수량</th>
                    <th className="whitespace-nowrap px-2 py-2 text-right font-medium sm:px-3">단가</th>
                    <th className="whitespace-nowrap px-2 py-2 text-right font-medium sm:px-3">금액</th>
                    <th className="px-1 py-2 text-right font-medium sm:px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-b-0">
                      <td className="whitespace-nowrap px-2 py-2.5 text-slate-500 sm:px-3">{p.date}</td>
                      <td className="whitespace-nowrap px-2 py-2.5 sm:px-3">
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-semibold sm:px-2 ${
                          p.type === 'buy'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-blue-50 text-blue-600'
                        }`}>
                          {p.type === 'buy' ? '매수' : '매도'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap tabular-nums px-2 py-2.5 text-right text-slate-700 sm:px-3">{formatNumber(p.quantity)}주</td>
                      <td className="whitespace-nowrap tabular-nums px-2 py-2.5 text-right text-slate-500 sm:px-3">{formatCurrency(p.pricePerShare, p.currency)}</td>
                      <td className="whitespace-nowrap tabular-nums px-2 py-2.5 text-right font-medium text-slate-900 sm:px-3">{formatCurrency(p.quantity * p.pricePerShare, p.currency)}</td>
                      <td className="px-1 py-2.5 text-right sm:px-3">
                        <button
                          onClick={() => deletePurchase(sectorId, companyId, p.id)}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
            </svg>
            현재 보유: <span className="tabular-nums font-semibold text-slate-700">{formatNumber(currentQty)}주</span>
          </div>
        </div>
      )}

      {/* 입력 폼 */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">새 거래 입력</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">유형</label>
            <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white">
              <button
                type="button"
                onClick={() => setType('buy')}
                className={`flex-1 px-3 py-1.5 text-sm font-medium transition-colors ${
                  type === 'buy'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                매수
              </button>
              <button
                type="button"
                onClick={() => setType('sell')}
                className={`flex-1 border-l border-slate-300 px-3 py-1.5 text-sm font-medium transition-colors ${
                  type === 'sell'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                매도
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              수량 {type === 'sell' && currentQty > 0 ? <span className="text-slate-400">(최대 {currentQty})</span> : ''}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="10"
              max={type === 'sell' ? currentQty : undefined}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-right text-sm tabular-nums focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              단가 <span className="text-slate-400">({defaultCurrency === 'KRW' ? '원' : '$'})</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={defaultCurrency === 'KRW' ? '75000' : '150.00'}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-right text-sm tabular-nums focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="col-span-2 flex items-end sm:col-span-1">
            <button
              onClick={handleAdd}
              className={`w-full rounded-lg px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors ${
                type === 'buy'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {type === 'buy' ? '매수 기록' : '매도 기록'}
            </button>
          </div>
        </div>

        {type === 'sell' && Number(quantity) > currentQty && currentQty >= 0 && (
          <p className="mt-2 text-xs text-rose-500">
            보유 수량({currentQty}주)을 초과할 수 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
