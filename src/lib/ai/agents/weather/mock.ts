import type { DailyWeatherData } from './types';

/**
 * 테스트에 사용될 도시별 가짜 날씨 데이터입니다.
 */
const mockWeatherData: Record<string, DailyWeatherData[]> = {
  '서울': [
    { date: '2025-05-25', temp_high: 24, temp_low: 15, condition: '맑음', precipitation_prob: 10 },
    { date: '2025-05-26', temp_high: 23, temp_low: 16, condition: '흐림', precipitation_prob: 40 },
    { date: '2025-05-27', temp_high: 21, temp_low: 15, condition: '비', precipitation_prob: 80 },
    { date: '2025-05-28', temp_high: 22, temp_low: 14, condition: '맑음', precipitation_prob: 20 },
    { date: '2025-05-29', temp_high: 25, temp_low: 17, condition: '맑음', precipitation_prob: 0 }
  ],
  '사가': [
    { date: '2025-05-25', temp_high: 18, temp_low: 10, condition: '흐림', precipitation_prob: 30 },
    { date: '2025-05-26', temp_high: 17, temp_low: 9, condition: '비', precipitation_prob: 70 },
    { date: '2025-05-27', temp_high: 19, temp_low: 11, condition: '흐림', precipitation_prob: 40 },
    { date: '2025-05-28', temp_high: 20, temp_low: 12, condition: '맑음', precipitation_prob: 10 },
    { date: '2025-05-29', temp_high: 19, temp_low: 11, condition: '비', precipitation_prob: 60 }
  ]
};

export default mockWeatherData;
