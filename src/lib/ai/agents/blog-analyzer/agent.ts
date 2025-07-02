import { Agent } from "../core";
import { fetchRawBlogs } from "./data-access";
import { BlogContentAnalyzer, BlogScorer } from "./logic";
import type { AnalyzedBlogResult, BlogAnalyzerInput, BlogAnalyzerOutput } from "./types";

/**
 * 블로그 분석가 에이전트입니다.
 * 블로그 검색, 분석, 스코어링 파이프라인을 오케스트레이션합니다.
 */
export class BlogAnalyzerAgent extends Agent<BlogAnalyzerInput, BlogAnalyzerOutput> {
  readonly name = 'BlogAnalyzer';

  // 생성자에서 의존성 주입 제거
  constructor() {
    super();
  }

  async run(input: BlogAnalyzerInput): Promise<BlogAnalyzerOutput> {
    try {
      const { location, userContext } = input;

      // 필요한 인스턴스들을 run 메서드 내부에서 직접 생성
      const blogContentAnalyzer = new BlogContentAnalyzer();
      const blogScorer = new BlogScorer();

      // 1. 원시 블로그 데이터 가져오기
      const rawBlogs = await fetchRawBlogs(location);

      // 2. 각 블로그 분석 및 요약
      const analyzedResults: AnalyzedBlogResult[] = [];
      for (const rawBlog of rawBlogs) {
        const analyzed = await blogContentAnalyzer.analyze(rawBlog, userContext);
        analyzedResults.push(analyzed);
      }

      // 3. 분석된 블로그 스코어링 (필터링은 여기서 하지 않음)
      const scoredBlogs = blogScorer.scoreBlogs(analyzedResults, userContext);

      return {
        status: 'success',
        data: scoredBlogs,
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
}
