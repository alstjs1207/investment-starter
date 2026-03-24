import { describe, it, expect } from 'vitest';
import { fetchStockPrice, fetchExchangeRate } from '@/utils/api';

// 실제 API를 호출하는 통합 테스트
// 네트워크 상태에 따라 실패할 수 있음
describe('API 통합 테스트', () => {
  describe('fetchStockPrice', () => {
    it('미국 주식 (AAPL) 조회', async () => {
      const quote = await fetchStockPrice('AAPL', 'NASDAQ');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.currency).toBe('USD');
      expect(quote.name).toBeTruthy();
      expect(quote.updatedAt).toBeTruthy();
      console.log('AAPL:', quote);
    }, 15_000);

    it('한국 주식 (삼성전자 005930) 조회', async () => {
      const quote = await fetchStockPrice('005930', 'KRX');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.currency).toBe('KRW');
      expect(quote.name).toBeTruthy();
      console.log('삼성전자:', quote);
    }, 15_000);
  });

  describe('fetchExchangeRate', () => {
    it('USD/KRW 환율 조회', async () => {
      // 캐시를 무시하기 위해 localStorage가 없는 환경에서 실행됨
      const result = await fetchExchangeRate();
      expect(result.rate).toBeGreaterThan(1000); // KRW/USD는 항상 1000 이상
      expect(result.rate).toBeLessThan(2000);    // 합리적 범위
      expect(result.updatedAt).toBeTruthy();
      console.log('환율:', result);
    }, 15_000);
  });
});
