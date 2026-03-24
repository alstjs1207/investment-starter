import type { Portfolio, Sector, Company, EntryZoneStatus } from '@/types';

/** 섹터의 투자 배정 금액 (전체 예산 KRW × 섹터 가중치) */
export function getSectorBudget(
  portfolio: Portfolio,
  sector: Sector,
): number {
  return portfolio.totalBudget * (sector.targetWeight / 100);
}

/** 기업의 투자 배정 금액 (전체 예산 KRW × 기업 비중) */
export function getCompanyBudget(
  portfolio: Portfolio,
  _sector: Sector,
  company: Company,
): number {
  return portfolio.totalBudget * (company.targetWeight / 100);
}

/** 기업의 총 매수 금액 (buy 거래만 합산) */
export function getTotalPurchaseAmount(company: Company): number {
  return company.purchases
    .filter((p) => p.type === 'buy')
    .reduce((sum, p) => sum + p.quantity * p.pricePerShare, 0);
}

/** 기업의 총 보유 수량 (buy 합계 - sell 합계) */
export function getTotalQuantity(company: Company): number {
  return company.purchases.reduce(
    (sum, p) => (p.type === 'buy' ? sum + p.quantity : sum - p.quantity),
    0,
  );
}

/** 매수 평균 단가 */
export function getAveragePrice(company: Company): number {
  const qty = getTotalQuantity(company);
  if (qty <= 0) return 0;
  const totalBuy = getTotalPurchaseAmount(company);
  return totalBuy / getBuyQuantity(company);
}

/** buy 거래의 총 수량 */
function getBuyQuantity(company: Company): number {
  return company.purchases
    .filter((p) => p.type === 'buy')
    .reduce((sum, p) => sum + p.quantity, 0);
}

/** 종목 수익률 계산 */
export interface StockReturn {
  avgPrice: number;
  currentPrice: number;
  quantity: number;
  purchaseAmount: number;
  marketValue: number;
  profitLoss: number;
  returnRate: number;
  currency: 'KRW' | 'USD';
}

export function calculateStockReturn(
  company: Company,
  currentPrice: number | null,
): StockReturn | null {
  const qty = getTotalQuantity(company);
  if (qty <= 0 || !currentPrice) return null;

  const buyQty = getBuyQuantity(company);
  if (buyQty <= 0) return null;

  const totalBuy = getTotalPurchaseAmount(company);
  const avgPrice = totalBuy / buyQty;
  const purchaseAmount = avgPrice * qty;
  const marketValue = currentPrice * qty;
  const profitLoss = marketValue - purchaseAmount;
  const returnRate = purchaseAmount > 0 ? (profitLoss / purchaseAmount) * 100 : 0;
  const currency = company.market === 'KRX' ? 'KRW' as const : 'USD' as const;

  return { avgPrice, currentPrice, quantity: qty, purchaseAmount, marketValue, profitLoss, returnRate, currency };
}

/** 섹터 수익률 */
export interface SectorReturn {
  sectorId: string;
  name: string;
  purchaseAmountKRW: number;
  marketValueKRW: number;
  profitLoss: number;
  returnRate: number;
  companies: (StockReturn & { name: string; ticker: string; companyId: string })[];
}

/** 전체 포트폴리오 수익률 */
export interface PortfolioReturn {
  totalPurchaseKRW: number;
  totalMarketKRW: number;
  totalProfitLoss: number;
  totalReturnRate: number;
  dailyProfitLoss: number;
  sectors: SectorReturn[];
}

export function calculatePortfolioReturn(
  portfolio: Portfolio,
  quotes: Record<string, { price: number; change?: number }>,
  exchangeRate: number | null,
): PortfolioReturn {
  const rate = exchangeRate ?? 1300;

  let totalPurchaseKRW = 0;
  let totalMarketKRW = 0;
  let dailyProfitLoss = 0;

  const sectors: SectorReturn[] = portfolio.sectors.map((sector) => {
    let sectorPurchaseKRW = 0;
    let sectorMarketKRW = 0;

    const companies = sector.companies
      .map((company) => {
        const quote = quotes[company.ticker];
        const ret = calculateStockReturn(company, quote?.price ?? null);
        if (!ret) return null;

        const isKRX = company.market === 'KRX';
        const companyRate = isKRX ? 1 : rate;
        sectorPurchaseKRW += ret.purchaseAmount * companyRate;
        sectorMarketKRW += ret.marketValue * companyRate;

        // 당일 손익: change × 보유수량
        if (quote?.change) {
          dailyProfitLoss += quote.change * ret.quantity * companyRate;
        }

        return {
          ...ret,
          name: company.name,
          ticker: company.ticker,
          companyId: company.id,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    totalPurchaseKRW += sectorPurchaseKRW;
    totalMarketKRW += sectorMarketKRW;

    const profitLoss = sectorMarketKRW - sectorPurchaseKRW;
    const returnRate = sectorPurchaseKRW > 0 ? (profitLoss / sectorPurchaseKRW) * 100 : 0;

    return {
      sectorId: sector.id,
      name: sector.name,
      purchaseAmountKRW: sectorPurchaseKRW,
      marketValueKRW: sectorMarketKRW,
      profitLoss,
      returnRate,
      companies,
    };
  });

  const totalProfitLoss = totalMarketKRW - totalPurchaseKRW;
  const totalReturnRate = totalPurchaseKRW > 0 ? (totalProfitLoss / totalPurchaseKRW) * 100 : 0;

  return {
    totalPurchaseKRW,
    totalMarketKRW,
    totalProfitLoss,
    totalReturnRate,
    dailyProfitLoss,
    sectors,
  };
}

/** 매수 가능 수량 (배정금액 ÷ 현재가) */
export function getBuyableQuantity(budget: number, currentPrice: number): number {
  if (currentPrice <= 0) return 0;
  return Math.floor(budget / currentPrice);
}

/** 섹터 내 기업 비중 합계 */
export function getSectorCompanyWeightSum(sector: Sector): number {
  return sector.companies.reduce((sum, c) => sum + c.targetWeight, 0);
}

/** 전체 섹터 비중 합계 */
export function getTotalSectorWeightSum(portfolio: Portfolio): number {
  return portfolio.sectors.reduce((sum, s) => sum + s.targetWeight, 0);
}

/** 비중 검증 결과 */
export interface WeightValidation {
  isValid: boolean;
  total: number;
  diff: number;
}

/** 섹터 비중 합계 검증 (100% 기준) */
export function validateSectorWeights(portfolio: Portfolio): WeightValidation {
  const total = getTotalSectorWeightSum(portfolio);
  return {
    isValid: Math.abs(total - 100) < 0.01,
    total,
    diff: total - 100,
  };
}

/** 기업 비중 합계 검증 (섹터 비중 기준) */
export function validateCompanyWeights(sector: Sector): WeightValidation {
  const total = getSectorCompanyWeightSum(sector);
  const target = sector.targetWeight;
  return {
    isValid: Math.abs(total - target) < 0.01,
    total,
    diff: total - target,
  };
}

/** 진입 구간 상태 계산 */
export interface EntryZoneResult {
  status: EntryZoneStatus;
  diffPercent: number; // 구간 대비 차이 (%)
}

export function calculateEntryZone(
  currentPrice: number | null | undefined,
  lower: number | undefined,
  upper: number | undefined,
): EntryZoneResult {
  if (lower == null || upper == null || !currentPrice) {
    return { status: 'not_set', diffPercent: 0 };
  }
  if (currentPrice >= lower && currentPrice <= upper) {
    return { status: 'entry_ok', diffPercent: 0 };
  }
  if (currentPrice > upper) {
    const diff = ((currentPrice - upper) / upper) * 100;
    return { status: 'waiting', diffPercent: diff };
  }
  // currentPrice < lower
  const diff = ((currentPrice - lower) / lower) * 100;
  return { status: 'below_zone', diffPercent: diff };
}

/** 숫자 포맷팅 (천 단위 콤마) */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** 통화 포맷팅 */
export function formatCurrency(value: number, currency: 'KRW' | 'USD'): string {
  if (currency === 'KRW') {
    return `${formatNumber(Math.round(value))}원`;
  }
  return `$${formatNumber(value, 2)}`;
}

// --- 비중 모니터링 ---

export type DeviationStatus = 'over' | 'under' | 'normal';

export interface CompanyWeight {
  companyId: string;
  name: string;
  ticker: string;
  market: Company['market'];
  targetWeight: number;
  purchaseWeight: number;
  marketWeight: number;
  purchaseDiff: number;
  marketDiff: number;
  purchaseStatus: DeviationStatus;
  marketStatus: DeviationStatus;
  purchaseAmount: number;
  marketValue: number;
}

export interface SectorWeight {
  sectorId: string;
  name: string;
  targetWeight: number;
  purchaseWeight: number;
  marketWeight: number;
  purchaseDiff: number;
  marketDiff: number;
  purchaseStatus: DeviationStatus;
  marketStatus: DeviationStatus;
  purchaseAmountKRW: number;
  purchaseAmountUSD: number;
  marketValueKRW: number;
  marketValueUSD: number;
  companies: CompanyWeight[];
}

function getStatus(diff: number): DeviationStatus {
  if (diff > 0.01) return 'over';
  if (diff < -0.01) return 'under';
  return 'normal';
}

/**
 * 포트폴리오 전체의 매수 기준 / 시가 기준 비중을 계산합니다.
 * quotes: ticker → { price } 맵
 * exchangeRate: USD → KRW 환율 (통화 통합 계산용)
 */
export function calculateWeights(
  portfolio: Portfolio,
  quotes: Record<string, { price: number }>,
  exchangeRate: number | null,
): SectorWeight[] {
  const rate = exchangeRate ?? 1300; // fallback

  // 1) 섹터/기업별 매수금액, 시가평가금액을 KRW 기준으로 합산
  let totalPurchaseKRW = 0;
  let totalMarketKRW = 0;

  const sectorData = portfolio.sectors.map((sector) => {
    let sectorPurchaseKRW = 0;
    let sectorMarketKRW = 0;
    let sectorPurchaseAmountKRW = 0;
    let sectorPurchaseAmountUSD = 0;
    let sectorMarketValueKRW = 0;
    let sectorMarketValueUSD = 0;

    const companiesData = sector.companies.map((company) => {
      const isKRX = company.market === 'KRX';
      const purchaseAmt = getTotalPurchaseAmount(company);
      const qty = getTotalQuantity(company);
      const quote = quotes[company.ticker];
      const marketVal = quote ? quote.price * qty : 0;

      // KRW 환산
      const purchaseKRW = isKRX ? purchaseAmt : purchaseAmt * rate;
      const marketKRW = isKRX ? marketVal : marketVal * rate;

      sectorPurchaseKRW += purchaseKRW;
      sectorMarketKRW += marketKRW;

      if (isKRX) {
        sectorPurchaseAmountKRW += purchaseAmt;
        sectorMarketValueKRW += marketVal;
      } else {
        sectorPurchaseAmountUSD += purchaseAmt;
        sectorMarketValueUSD += marketVal;
      }

      return {
        company,
        purchaseAmt,
        marketVal,
        purchaseKRW,
        marketKRW,
      };
    });

    totalPurchaseKRW += sectorPurchaseKRW;
    totalMarketKRW += sectorMarketKRW;

    return {
      sector,
      companiesData,
      sectorPurchaseKRW,
      sectorMarketKRW,
      sectorPurchaseAmountKRW,
      sectorPurchaseAmountUSD,
      sectorMarketValueKRW,
      sectorMarketValueUSD,
    };
  });

  // 2) 비중 계산 (총 예산 대비)
  const totalBudget = portfolio.totalBudget;

  return sectorData.map((sd) => {
    const purchaseWeight = totalBudget > 0 ? (sd.sectorPurchaseKRW / totalBudget) * 100 : 0;
    const marketWeight = totalBudget > 0 ? (sd.sectorMarketKRW / totalBudget) * 100 : 0;
    const purchaseDiff = purchaseWeight - sd.sector.targetWeight;
    const marketDiff = marketWeight - sd.sector.targetWeight;

    // 포트폴리오 전체 예산 대비 기업 비중
    const companies: CompanyWeight[] = sd.companiesData.map((cd) => {
      const cpWeight =
        totalBudget > 0 ? (cd.purchaseKRW / totalBudget) * 100 : 0;
      const cmWeight =
        totalBudget > 0 ? (cd.marketKRW / totalBudget) * 100 : 0;
      const cpDiff = cpWeight - cd.company.targetWeight;
      const cmDiff = cmWeight - cd.company.targetWeight;

      return {
        companyId: cd.company.id,
        name: cd.company.name,
        ticker: cd.company.ticker,
        market: cd.company.market,
        targetWeight: cd.company.targetWeight,
        purchaseWeight: cpWeight,
        marketWeight: cmWeight,
        purchaseDiff: cpDiff,
        marketDiff: cmDiff,
        purchaseStatus: getStatus(cpDiff),
        marketStatus: getStatus(cmDiff),
        purchaseAmount: cd.purchaseAmt,
        marketValue: cd.marketVal,
      };
    });

    return {
      sectorId: sd.sector.id,
      name: sd.sector.name,
      targetWeight: sd.sector.targetWeight,
      purchaseWeight,
      marketWeight,
      purchaseDiff,
      marketDiff,
      purchaseStatus: getStatus(purchaseDiff),
      marketStatus: getStatus(marketDiff),
      purchaseAmountKRW: sd.sectorPurchaseAmountKRW,
      purchaseAmountUSD: sd.sectorPurchaseAmountUSD,
      marketValueKRW: sd.sectorMarketValueKRW,
      marketValueUSD: sd.sectorMarketValueUSD,
      companies,
    };
  });
}

// --- 리밸런싱 추천 ---

export type RebalanceAction = 'sell' | 'buy' | 'hold';

export interface RebalanceItem {
  sectorId: string;
  sectorName: string;
  companyId: string;
  name: string;
  ticker: string;
  market: Company['market'];
  action: RebalanceAction;
  currentQuantity: number;
  targetQuantity: number;
  deltaQuantity: number;
  currentPrice: number;
  estimatedAmount: number;
  currency: 'KRW' | 'USD';
  sectorAction: RebalanceAction | null;
  /** 섹터의 시가 기준 초과/미달 비율 (%) */
  sectorMarketDiff: number;
  /** 매도 시 실현 손익 (매도 수량 × (현재가 - 평균단가)) */
  realizedPnL: number | null;
  /** 매도 시 실현 손익률 (%) */
  realizedPnLRate: number | null;
}

/**
 * 시가 기준 현재 비중과 목표 비중 차이를 계산하여
 * 종목별 매도/매수 수량을 추천합니다.
 */
export function calculateRebalance(
  portfolio: Portfolio,
  quotes: Record<string, { price: number }>,
  exchangeRate: number | null,
): RebalanceItem[] {
  const rate = exchangeRate ?? 1300;
  const weights = calculateWeights(portfolio, quotes, exchangeRate);

  // 목표 수량 계산의 기준금액: 전체 예산 (목표 비중이 예산 대비로 설정됨)
  const baseKRW = portfolio.totalBudget;

  if (baseKRW === 0) return [];

  // 보유 종목이 없으면 리밸런싱 대상 없음
  const totalMarketKRW = weights.reduce((sum, sw) => {
    return sum + sw.marketValueKRW + sw.marketValueUSD * rate;
  }, 0);
  if (totalMarketKRW === 0) return [];

  const items: RebalanceItem[] = [];

  for (const sw of weights) {
    const sector = portfolio.sectors.find((s) => s.id === sw.sectorId);
    if (!sector) continue;

    // 섹터 단위 액션 판단 (예산 기준 시가 비중 — 앱 전체와 동일한 기준)
    const sectorMarketDiff = sw.marketDiff;
    const sectorAction: RebalanceAction =
      sectorMarketDiff > 0.01 ? 'sell' : sectorMarketDiff < -0.01 ? 'buy' : 'hold';

    for (const cw of sw.companies) {
      const company = sector.companies.find((c) => c.id === cw.companyId);
      if (!company) continue;

      const quote = quotes[company.ticker];
      if (!quote || quote.price <= 0) continue;

      const currentQty = getTotalQuantity(company);
      const isKRX = company.market === 'KRX';
      const currency: 'KRW' | 'USD' = isKRX ? 'KRW' : 'USD';

      // 목표 금액: 전체 예산 × 기업 목표비중
      const companyTargetKRW = baseKRW * (cw.targetWeight / 100);

      // 목표 금액을 해당 통화로 변환
      const companyTargetInCurrency = isKRX ? companyTargetKRW : companyTargetKRW / rate;

      // 목표 수량 (내림)
      const targetQty = Math.floor(companyTargetInCurrency / quote.price);
      const delta = targetQty - currentQty;

      if (delta === 0) continue;

      const action: RebalanceAction = delta > 0 ? 'buy' : 'sell';

      // 매도 시 실현 손익 계산
      let realizedPnL: number | null = null;
      let realizedPnLRate: number | null = null;
      if (action === 'sell') {
        const avgPrice = getAveragePrice(company);
        if (avgPrice > 0) {
          const sellQty = Math.abs(delta);
          realizedPnL = sellQty * (quote.price - avgPrice);
          const costBasis = sellQty * avgPrice;
          realizedPnLRate = costBasis > 0 ? (realizedPnL / costBasis) * 100 : 0;
        }
      }

      items.push({
        sectorId: sw.sectorId,
        sectorName: sw.name,
        companyId: cw.companyId,
        name: cw.name,
        ticker: cw.ticker,
        market: cw.market,
        action,
        currentQuantity: currentQty,
        targetQuantity: targetQty,
        deltaQuantity: Math.abs(delta),
        currentPrice: quote.price,
        estimatedAmount: Math.abs(delta) * quote.price,
        currency,
        sectorAction: sectorAction !== 'hold' ? sectorAction : null,
        sectorMarketDiff,
        realizedPnL,
        realizedPnLRate,
      });
    }
  }

  // 매도 → 매수 순으로 정렬
  items.sort((a, b) => {
    if (a.action === 'sell' && b.action === 'buy') return -1;
    if (a.action === 'buy' && b.action === 'sell') return 1;
    return 0;
  });

  return items;
}
