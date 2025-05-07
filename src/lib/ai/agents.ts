import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import { mockBlogData } from "./mock";

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

  const results = [
    `${location} 날씨 정보 (${startDate} ~ ${endDate}):`,
    `2025-05-26: 맑음, 온도(최고 25도, 최저 15도),`,
    `2025-05-27: 흐림, 비 약간, 온도(최고 20도, 최저 12도)`,
    `2025-05-28: 구름 조금, 온도(최고 23도, 최저 14도)`,
  ];
  // 취합된 결과를 하나의 문자열로 반환
  return results.join('\n');
}

//
function searchBlogTool() {
  const blogTool = new DynamicStructuredTool({
    name: "search_saga_blogs", // 도구 이름 (사가 전용임을 나타낼 수 있음)
    description: "지역에 관련된 블로그 게시물을 검색합니다. 여행 계획, 장소 정보, 맛집/카페 찾기 등에 유용합니다. 입력으로 검색할 지역(location)을 받으며, 해당 지역 관련 블로그의 제목, URL, 내용을 반환합니다.",
    schema: z.object({
      location: z.string().describe("검색할 블로그 게시물의 지역. '일본 사가'와 같이 구체적으로 명시해주세요."),
    }),
    func: _searchBlogs, // 위에서 정의한 검색 함수 연결
  });

  return blogTool;
}
async function _searchBlogs({ location }: { location: string }): Promise<string> {
  const results = mockBlogData;

  if (!results || results.length === 0) {
    return `"${location}"에 대한 블로그 검색 결과를 찾을 수 없습니다.`;
  }

  //TODO: 임베딩이 필요할 수 있음.
  const formattedResults = [`"${location}" 관련 블로그 검색 결과 (${results.length}개):`];
  results.forEach((blog, index) => {
      const contentSnippet = blog.content;

      formattedResults.push(`\n--- 블로그 ${index + 1} ---`);
      formattedResults.push(`제목: ${blog.title}`);
      formattedResults.push(`URL: ${blog.url}`);
      formattedResults.push(`내용: ${contentSnippet}`);
  });

  return formattedResults.join('\n');
}

export { searchWeatherTool, searchBlogTool };