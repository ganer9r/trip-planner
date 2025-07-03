import type { BaseAgentInput, BaseAgentOutput } from '../core';

/**
 * WeatherAgent에 대한 입력 인터페이스입니다.
 * @param location - 날씨를 조회할 지역 (예: '서울')
 * @param dateRange - 날씨를 조회할 날짜 범위 (예: '2025-05-26 - 2025-05-28')
 */
export interface WeatherInput extends BaseAgentInput {
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

/**
 * 하루 동안의 날씨 데이터를 정의합니다.
 * @param date - 날짜 (YYYY-MM-DD)
 * @param temp_high - 최고 기온
 * @param temp_low - 최저 기온
 * @param condition - 날씨 상태 (예: '맑음', '비')
 * @param precipitation_prob - 강수 확률 (%)
 */
export interface DailyWeatherData {
  date: string;
  temp_high: number;
  temp_low: number;
  condition: '맑음' | '흐림' | '비' | '눈';
  precipitation_prob: number;
}

/**
 * WeatherAgent의 최종 출력 인터페이스입니다.
 */
export interface WeatherOutput extends BaseAgentOutput {
  data: DailyWeatherData[];
}
