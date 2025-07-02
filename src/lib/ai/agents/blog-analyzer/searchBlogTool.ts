import { DynamicStructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import { BlogAnalyzerAgent, BlogAnalyzerOutput } from "./agent";

//
function searchBlogTool() {
  const blogTool = new DynamicStructuredTool({
    name: "search_saga_blogs", // 도구 이름 (사가 전용임을 나타낼 수 있음)
    description: "지역에 관련된 블로그 게시물을 검색하고 분석합니다. 여행 계획, 장소 정보, 맛집/카페 찾기 등에 유용합니다. 입력으로 검색할 지역(location)을 받으며, 해당 지역 관련 블로그의 분석된 핵심 정보를 반환합니다.",
    schema: z.object({
      location: z.string().describe("검색할 블로그 게시물의 지역. '일본 사가'와 같이 구체적으로 명시해주세요."),
    }),
    func: _searchBlogs, // 위에서 정의한 검색 함수 연결
  });

  return blogTool;
}
async function _searchBlogs({ location }: { location: string }): Promise<BlogAnalyzerOutput['data']> {
  console.log('📝 블로그 검색 함수 호출:', { location });

  const blogAnalyzer = new BlogAnalyzerAgent(); // 인자 없이 생성
  const result = await blogAnalyzer.run({
    location: location,
    userContext: { location: location } // userContext는 location으로 임시 설정
  });

  if (result.status === 'success') {
    console.log('📝 블로그 분석 및 스코어링 결과:', result.data);
    return result.data;
  } else {
    console.error('📝 블로그 분석 실패:', result.errorMessage);
    return [];
  }
}

export { searchBlogTool };