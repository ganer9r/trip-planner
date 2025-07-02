import type { AnalyzedBlogResult, RawBlogData, UserContext } from "./types";

/**
 * 블로그 콘텐츠를 분석하고 핵심 정보를 추출하는 로직을 담당합니다.
 */
export class BlogContentAnalyzer {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async analyze(rawBlog: RawBlogData, _userContext: UserContext): Promise<AnalyzedBlogResult> {
    console.log(`[BlogContentAnalyzer]: Analyzing blog: ${rawBlog.title}`);
    // 현재는 목업 데이터를 기반으로 분석 결과를 생성합니다.
    const analyzedResult: AnalyzedBlogResult = {
      originalUrl: rawBlog.url,
      title: rawBlog.title,
      summary: rawBlog.content.substring(0, Math.min(rawBlog.content.length, 100)) + '...', // 첫 100자 요약
      extractedEntities: [
        {
          name: rawBlog.title.includes('온천') ? '우레시노 온천' : '사가규 맛집',
          type: rawBlog.title.includes('온천') ? 'place' : 'restaurant',
          description: rawBlog.title.includes('온천') ? '피부 미인 온천으로 유명' : '입에서 살살 녹는 사가규 전문점',
          sentiment: 'positive',
          keywords: rawBlog.title.includes('온천') ? ['온천', '힐링'] : ['맛집', '사가규'],
        },
        {
          name: '아리타 도자기 마을',
          type: 'activity',
          description: '400년 역사의 도자기 마을 탐방',
          sentiment: 'positive',
          keywords: ['도자기', '문화', '체험'],
        },
      ],
      overallSentiment: 'positive',
      relevanceScore: Math.random() * 0.5 + 0.5, // 0.5 ~ 1.0 사이의 임의 점수
    };
    return analyzedResult;
  }
}

/**
 * 분석된 블로그에 스코어를 매기는 로직을 담당합니다.
 */
export class BlogScorer {
  scoreBlogs(analyzedBlogs: AnalyzedBlogResult[], userContext: UserContext): AnalyzedBlogResult[] {
    console.log(`[BlogScorer]: Scoring blogs based on user context`);
    const scoredResults = analyzedBlogs.map(result => {
      let score = result.relevanceScore; // 기본 점수

      // 사용자 관심사에 따른 스코어링 (간단한 목업 로직)
      if (userContext.interests) {
        const userInterests = userContext.interests.toLowerCase().split(/,\s*/);
        const blogKeywords = result.extractedEntities.flatMap(e => e.keywords || []).map(k => k.toLowerCase());
        const blogSummary = result.summary.toLowerCase();

        userInterests.forEach(interest => {
          if (blogKeywords.includes(interest) || blogSummary.includes(interest)) {
            score += 0.1; // 관심사 일치 시 가점
          }
        });
      }

      // 점수 상한선 설정
      return { ...result, relevanceScore: Math.min(1.0, score) };
    });

    // 스코어링된 결과 정렬 (필터링은 여기서 하지 않음)
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scoredResults;
  }
}