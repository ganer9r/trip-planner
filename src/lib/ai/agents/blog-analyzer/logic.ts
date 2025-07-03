import { mockAnalyzedBlogResultsData, mockRankedPlacesData } from './mock';
import type { AnalyzedBlogResult, RawBlogData, UserContext, RankedPlace } from './types';

/**
 * 블로그 콘텐츠를 분석하고 핵심 정보를 추출하는 로직을 담당합니다.
 */
export class BlogContentAnalyzer {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async analyze(rawBlog: RawBlogData, _userContext: UserContext): Promise<AnalyzedBlogResult> {
    console.log(`[BlogContentAnalyzer]: Analyzing blog: ${rawBlog.title}`);

    // rawBlog.url 과 mockAnalyzedBlogResults[].originalUrl 이 같은것 리턴
    const analyzedBlogResult = mockAnalyzedBlogResultsData.find((result: AnalyzedBlogResult) => result.originalUrl === rawBlog.url);
    if (!analyzedBlogResult) {
      throw new Error(`같은거 없음.: ${rawBlog.url}`);
    }
    return analyzedBlogResult;
  }
}

/**
 * 분석된 블로그 목록에서 장소를 추출하고 순위를 매기는 로직을 담당합니다.
 */
export class BlogAnalysisLogic {
  extractAndRankPlaces(
    analyzedBlogs: AnalyzedBlogResult[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userContext: UserContext
  ): RankedPlace[] {
    console.log(`[BlogAnalysisLogic]: Extracting and ranking places. ${analyzedBlogs.length} blogs`);
    return mockRankedPlacesData;
  }
}
