import { Agent } from "../core";
import { fetchRawBlogs } from "./data-access";
import { BlogContentAnalyzer, BlogAnalysisLogic } from "./logic";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { BlogAnalyzerInput, BlogAnalyzerOutput } from "./types";

/**
 * 블로그 분석가 에이전트입니다.
 * 블로그 검색, 분석, 장소 추출 및 순위 부여 파이프라인을 오케스트레이션합니다.
 */
export class BlogAnalyzerAgent extends Agent<BlogAnalyzerInput, BlogAnalyzerOutput> {
  readonly name = 'BlogAnalyzer';
  private readonly contentAnalyzer: BlogContentAnalyzer;
  private readonly analysisLogic: BlogAnalysisLogic;

  constructor() {
    super();
    this.contentAnalyzer = new BlogContentAnalyzer();
    this.analysisLogic = new BlogAnalysisLogic();
  }

  async run(input: BlogAnalyzerInput): Promise<BlogAnalyzerOutput> {
    try {
      const { location, userContext } = input;

      // 1. 원시 블로그 데이터 가져오기
      const rawBlogs = await fetchRawBlogs(location);
      if (rawBlogs.length === 0) {
        return { status: 'success', data: [] };
      }

      // 2. 각 블로그 분석 (Promise.all로 병렬 처리)
      const analysisPromises = rawBlogs.map(rawBlog =>
        this.contentAnalyzer.analyze(rawBlog, userContext)
      );
      const analyzedBlogs = await Promise.all(analysisPromises);

      // 3. 분석된 블로그에서 장소 추출 및 순위 부여
      const rankedPlaces = this.analysisLogic.extractAndRankPlaces(analyzedBlogs, userContext);

      return {
        status: 'success',
        data: rankedPlaces,
      };
    } catch (error: unknown) {
      console.error(`[${this.name} Agent Error]:`, error);
      return {
        status: 'failure',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        data: [],
      };
    }
  }

  /**
   * LangChain 도구로 사용할 수 있는 tool을 반환합니다.
   */
  tool() {
    const blogTool = new DynamicStructuredTool({
      name: "search_blogs_and_rank_places",
      description: "특정 지역에 대한 블로그를 검색, 분석하여 여행에 갈만한 장소들을 추천 순위로 보여줍니다. 여행 계획, 장소 정보, 맛집/카페 찾기 등에 유용합니다.",
      schema: z.object({
        location: z.string().describe("검색할 지역. '일본 사가'와 같이 구체적으로 명시해주세요."),
      }),
      func: async ({ location }: { location: string }) => {
        console.log('📝 장소 검색 및 순위 분석 함수 호출:', { location });

        const result = await this.run({
          location: location,
          userContext: { location: location } // userContext는 임시로 설정
        });

        if (result.status === 'success') {
          console.log('📝 장소 분석 및 순위 결과:', result.data);
          // 최종 결과가 RankedPlace[] 형태이므로, Langchain이 이해할 수 있는 문자열로 변환
          return JSON.stringify(result.data, null, 2);
        } else {
          console.error('📝 장소 분석 실패:', result.errorMessage);
          return `에러 발생: ${result.errorMessage}`;
        }
      },
    });

    return blogTool;
  }
}
