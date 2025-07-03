import type { RawBlogData, AnalyzedBlogResult, RankedPlace } from './types';

// =================================================================
// MOCK DATA FOR TESTING THE ENTIRE AGENT FLOW
// =================================================================

/**
 * 1. `fetchRawBlogs()`가 반환할 원시 데이터 mock
 */
export const mockFetchRawBlogsData: RawBlogData[] = [
  {
    url: 'https://blog.naver.com/saga_park/111',
    title: '환상적인 사가 아리타 포슬린파크 방문 후기!',
    content: '유럽 궁전 같은 외관에 놀랐어요. 아리타 도자기의 역사를 한눈에 볼 수 있고, 직접 체험도 가능해서 아이들과 오기 좋네요. 인생샷 명소로 강력 추천합니다. 점심은 근처 소바집에서 해결했어요.'
  },
  {
    url: 'https://tistory.com/saga_onsen/222',
    title: '피로가 싹 풀리는 다케오 온천 여행',
    content: '1300년 역사의 다케오 온천. 미끌미끌한 온천수가 피부를 부드럽게 만들어주네요. 료칸에서 숙박하며 온천을 즐기니 신선이 된 기분입니다. 주변에 작은 신사도 있어서 산책하기 좋았습니다.'
  }
];

/**
 * 2. `analyze()`가 `mockRawBlogsForFlow`를 분석한 후의 중간 결과물 mock
 */
export const mockAnalyzedBlogResultsData: AnalyzedBlogResult[] = [
  // 첫 번째 블로그 분석 결과
  {
    originalUrl: 'https://blog.naver.com/saga_park/111',
    title: '환상적인 사가 아리타 포슬린파크 방문 후기!',
    summary: '유럽 궁전 같은 외관의 아리타 포슬린파크는 도자기 역사 학습과 체험이 가능하며, 사진 촬영 명소로 추천됨.',
    extractedEntities: [
      {
        name: '아리타 포슬린파크',
        type: 'place',
        description: '유럽 궁전 외관의 도자기 테마파크, 역사 학습 및 체험 가능',
        keywords: ['도자기', '테마파크', '체험', '사진명소'],
        sentiment: 'positive',
        score: 9.5
      },
      {
        name: '근처 소바집',
        type: 'restaurant',
        description: '점심 식사를 해결한 소바 전문점',
        keywords: ['소바', '맛집', '점심'],
        sentiment: 'neutral'
      }
    ]
  },
  // 두 번째 블로그 분석 결과
  {
    originalUrl: 'https://tistory.com/saga_onsen/222',
    title: '피로가 싹 풀리는 다케오 온천 여행',
    summary: '1300년 역사의 다케오 온천은 피부에 좋은 온천수와 료칸 숙박 경험을 제공함.',
    extractedEntities: [
      {
        name: '다케오 온천',
        type: 'place',
        description: '1300년 역사의 온천, 부드러운 수질이 특징',
        keywords: ['온천', '휴양', '료칸', '피부미용'],
        sentiment: 'positive',
        score: 9.2
      },
      {
        name: '작은 신사',
        type: 'place',
        description: '다케오 온천 주변에 위치한 산책하기 좋은 신사',
        keywords: ['신사', '산책'],
        sentiment: 'positive',
        score: 7.8
      }
    ]
  }
];

/**
 * 3. `extractAndRankPlaces()`가 `mockAnalyzedResultsForFlow`를 처리한 후의 최종 결과물 mock
 */
export const mockRankedPlacesData: RankedPlace[] = [
  {
    name: '아리타 포슬린파크',
    score: 9.5,
    description: '유럽 궁전 외관의 도자기 테마파크, 역사 학습 및 체험 가능',
    keywords: ['도자기', '테마파크', '체험', '사진명소'],
    sourceUrl: 'https://blog.naver.com/saga_park/111'
  },
  {
    name: '다케오 온천',
    score: 9.2,
    description: '1300년 역사의 온천, 부드러운 수질이 특징',
    keywords: ['온천', '휴양', '료칸', '피부미용'],
    sourceUrl: 'https://tistory.com/saga_onsen/222'
  },
  {
    name: '작은 신사',
    score: 7.8,
    description: '다케오 온천 주변에 위치한 산책하기 좋은 신사',
    keywords: ['신사', '산책'],
    sourceUrl: 'https://tistory.com/saga_onsen/222'
  }
];