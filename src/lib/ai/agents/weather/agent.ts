import { Agent } from '../core';
import { fetchWeatherData } from './data-access';
import type { WeatherInput, WeatherOutput } from './types';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * 특정 지역과 기간의 날씨 정보를 조회하는 에이전트입니다.
 */
export class WeatherAgent extends Agent<WeatherInput, WeatherOutput> {
  readonly name = 'WeatherAgent';

  constructor() {
    super();
  }

  /**
   * 에이전트의 주 실행 로직입니다.
   * @param input - 위치와 날짜 범위
   * @returns 날씨 데이터 배열을 포함하는 출력 객체
   */
  async run(input: WeatherInput): Promise<WeatherOutput> {
    try {
      const { location, startDate, endDate } = input;

      // 데이터 접근 계층을 통해 날씨 데이터 조회
      const weatherData = await fetchWeatherData(location, startDate, endDate);

      return {
        status: 'success',
        data: weatherData
      };
    } catch (error: unknown) {
      console.error(`[${this.name} Error]:`, error);
      return {
        status: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        data: []
      };
    }
  }

  /**
   * LangChain 도구로 사용할 수 있는 tool을 반환합니다.
   */
  tool() {
    return new DynamicStructuredTool({
      name: 'get_weather_forecast',
      description: '특정 도시의 시작일과 종료일 사이의 날씨 예보를 가져옵니다. 여행 계획 시 날씨를 확인하는 데 사용됩니다.',
      schema: z.object({
        location: z.string().describe('날씨를 조회할 도시 이름 (예: 서울, 런던)'),
        startDate: z.string().describe('조회 시작일 (YYYY-MM-DD 형식)'),
        endDate: z.string().describe('조회 종료일 (YYYY-MM-DD 형식)')
      }),
      func: async ({ location, startDate, endDate }) => {
        console.log('🌦️ 날씨 예보 도구 호출:', { location, startDate, endDate });
        const result = await this.run({ location, startDate, endDate });

        if (result.status === 'success') {
          // LLM이 결과를 쉽게 이해할 수 있도록 문자열로 변환
          return JSON.stringify(result.data, null, 2);
        } else {
          return `에러 발생: ${result.errorMessage}`;
        }
      }
    });
  }
}
