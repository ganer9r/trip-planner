import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { BlogAnalyzerAgent } from "./agents/blog-analyzer/agent";

//
function searchWeatherTool() {
  const weatherTool = tool(
    async ({ location, startDate, endDate }) => {
      const summary = await _searchWeatherRange({location, startDate, endDate});
      return summary;            // 문자열 반환
    },
    {
      name: "searchWeather",
      description: "도시 + 기간의 날씨 요약",
      schema: z.object({
        location:  z.string(),
        startDate: z.string(),
        endDate:   z.string(),
      }),
    }
  );

  return weatherTool;
}
async function _searchWeatherRange(input: { location: string; startDate: string; endDate: string }): Promise<string> {
  const { location, startDate, endDate } = input;

  console.log('🌤️ 날씨 검색 함수 호출:', { location, startDate, endDate });

  const results = [
    `${location} 날씨 정보 (${startDate} ~ ${endDate}):`,
    `2025-05-26: 맑음, 온도(최고 25도, 최저 15도),`,
    `2025-05-27: 흐림, 비 약간, 온도(최고 20도, 최저 12도),`,
    `2025-05-28: 구름 조금, 온도(최고 23도, 최저 14도),`,
  ];
  // 취합된 결과를 하나의 문자열로 반환
  console.log('🌤️ 날씨 검색 결과:', results.join('\n'));
  return results.join('\n');
}

export { searchWeatherTool, BlogAnalyzerAgent };