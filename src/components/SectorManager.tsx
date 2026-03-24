import { useState } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { validateSectorWeights } from '@/utils/calc';
import CompanyManager from './CompanyManager';

export default function SectorManager() {
  const { portfolio, addSector, updateSector, deleteSector } = usePortfolioStore();
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const validation = validateSectorWeights(portfolio);

  const handleAdd = () => {
    const name = newName.trim();
    const weight = Number(newWeight);
    if (!name || !weight || weight <= 0) return;
    addSector(name, weight);
    setNewName('');
    setNewWeight('');
  };

  const handleStartEdit = (id: string) => {
    const sector = portfolio.sectors.find((s) => s.id === id);
    if (!sector) return;
    setEditingId(id);
    setEditName(sector.name);
    setEditWeight(String(sector.targetWeight));
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateSector(editingId, {
      name: editName.trim(),
      targetWeight: Number(editWeight),
    });
    setEditingId(null);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-slate-900">섹터 관리</h2>
          </div>
          {portfolio.sectors.length > 0 && (
            <span className="tabular-nums text-xs text-slate-400">{portfolio.sectors.length}개 섹터</span>
          )}
        </div>
      </div>

      <div className="p-5">
        {!validation.isValid && portfolio.sectors.length > 0 && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-amber-800">
              합계: <span className="tabular-nums font-semibold">{validation.total}%</span> / 100%
              {validation.diff > 0
                ? <span className="text-rose-600"> — {validation.diff}%p 초과</span>
                : <span> — {Math.abs(validation.diff)}%p 미배분</span>}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {portfolio.sectors.map((sector) => (
            <div key={sector.id} className="overflow-hidden rounded-lg border border-slate-200">
              {editingId === sector.id ? (
                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="w-20 rounded-lg border border-slate-300 px-3 py-1.5 text-right text-sm tabular-nums focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="text-sm text-slate-500">%</span>
                  <button
                    onClick={handleSaveEdit}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div>
                  <div
                    className="flex cursor-pointer items-center justify-between bg-white px-4 py-3 transition-colors hover:bg-slate-50"
                    onClick={() => setExpandedId(expandedId === sector.id ? null : sector.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                        {sector.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-medium text-slate-800">{sector.name}</span>
                        <span className="ml-2 text-xs text-slate-400">
                          {sector.companies.length}개 종목
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-semibold text-emerald-700">
                        {sector.targetWeight}%
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStartEdit(sector.id); }}
                        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteSector(sector.id); }}
                        className="rounded p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                      <svg className={`h-4 w-4 text-slate-400 transition-transform ${expandedId === sector.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                  {expandedId === sector.id && (
                    <div className="border-t border-slate-100 bg-slate-50/30 p-4">
                      <CompanyManager sectorId={sector.id} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 추가 폼 */}
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">새 섹터 추가</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="섹터 이름 (예: IT)"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none sm:flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="비중"
                className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-sm tabular-nums focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none sm:w-24"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <span className="text-sm text-slate-500">%</span>
              <button
                onClick={handleAdd}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
