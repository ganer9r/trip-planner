import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeatherAgent } from './agent';
import { fetchWeatherData } from './data-access';
import mockWeatherData from './mock';
import type { WeatherInput } from './types';

// Mock the data-access layer
vi.mock('./data-access');

const mockFetchWeatherData = vi.mocked(fetchWeatherData);

describe('WeatherAgent', () => {
  let agent: WeatherAgent;

  beforeEach(() => {
    vi.resetAllMocks();
    agent = new WeatherAgent();
  });

  it('요청된 위치와 날짜 범위에 대한 날씨 데이터를 성공적으로 반환해야 한다', async () => {
    const input: WeatherInput = {
      location: '서울',
      startDate: '2025-05-26',
      endDate: '2025-05-28'
    };

    // `data-access`가 반환할 예상 결과물 설정
    const expectedData = mockWeatherData['서울'].filter(
      d => d.date >= input.startDate && d.date <= input.endDate
    );
    mockFetchWeatherData.mockResolvedValue(expectedData);

    // 에이전트 실행
    const result = await agent.run(input);

    // 결과 검증
    expect(result.status).toBe('success');
    expect(result.data).toEqual(expectedData);
    expect(result.data.length).toBe(3);

    // `fetchWeatherData`가 올바른 인자로 호출되었는지 확인
    expect(mockFetchWeatherData).toHaveBeenCalledWith(input.location, input.startDate, input.endDate);
  });

  it('데이터가 없는 위치에 대해서는 빈 배열을 반환해야 한다', async () => {
    const input: WeatherInput = {
      location: '화성',
      startDate: '2025-05-26',
      endDate: '2025-05-28'
    };

    mockFetchWeatherData.mockResolvedValue([]);

    const result = await agent.run(input);

    expect(result.status).toBe('success');
    expect(result.data).toEqual([]);

    expect(mockFetchWeatherData).toHaveBeenCalledWith(input.location, input.startDate, input.endDate);
  });

  it('데이터 접근 중 에러 발생 시 failure 상태를 반환해야 한다', async () => {
    const input: WeatherInput = {
      location: '서울',
      startDate: '2025-05-26',
      endDate: '2025-05-28'
    };
    const errorMessage = 'External API is down';

    mockFetchWeatherData.mockRejectedValue(new Error(errorMessage));

    const result = await agent.run(input);

    expect(result.status).toBe('failure');
    expect(result.data).toEqual([]);
    expect(result.errorMessage).toBe(errorMessage);
  });

  it('should return a valid LangChain tool', () => {
    const tool = agent.tool();

    expect(tool.name).toBe('get_weather_forecast');
    expect(tool.description).toBeDefined();
    expect(tool.schema).toBeDefined();
    expect(typeof tool.func).toBe('function');

    // Check schema properties by accessing the shape
    const shape = tool.schema.shape;
    expect(shape.location).toBeDefined();
    expect(shape.startDate).toBeDefined();
    expect(shape.endDate).toBeDefined();
  });
});
