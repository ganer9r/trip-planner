import mockWeatherData from './mock';
import type { DailyWeatherData } from './types';

/**
 * 날짜 문자열 (YYYY-MM-DD)을 Date 객체로 변환합니다.
 * @param dateString - 날짜 문자열
 */
const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * 외부 날씨 API를 호출하여 특정 기간의 날씨 데이터를 가져오는 것을 시뮬레이션합니다.
 * @param location - 조회할 도시
 * @param dateRange - 조회할 날짜 범위 (예: '2025-05-26 - 2025-05-28')
 * @returns 해당 기간의 날씨 데이터 배열
 */
export const fetchWeatherData = async (
  location: string,
  startDate: string,
  endDate: string
): Promise<DailyWeatherData[]> => {
  console.log(`[DataAccess] Fetching weather for ${location} from ${startDate} to ${endDate}`);

  const cityData = mockWeatherData[location];
  if (!cityData) {
    return [];
  }

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  // 해당 날짜 범위에 맞는 데이터 필터링
  const filteredData = cityData.filter(dailyData => {
    const currentDate = parseDate(dailyData.date);
    return currentDate >= start && currentDate <= end;
  });

  // 실제 API 호출을 시뮬레이션하기 위한 약간의 딜레이
  await new Promise(resolve => setTimeout(resolve, 50));

  return filteredData;
};
