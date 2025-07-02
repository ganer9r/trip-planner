import { type BaseAgentInput, type BaseAgentOutput } from '../../agents/core';

export interface AnalyzedBlogResult {
  originalUrl: string;
  title: string;
  summary: string; // 블로그 전체 요약
  extractedEntities: { // 블로그에서 추출된 핵심 장소, 활동, 맛집 등
    name: string;
    type: 'place' | 'activity' | 'restaurant' | 'hotel' | 'tip';
    description: string; // 해당 엔티티에 대한 간략한 설명
    keywords?: string[]; // 해당 엔티티와 관련된 키워드
    sentiment?: 'positive' | 'negative' | 'neutral'; // 해당 엔티티에 대한 감성
  }[];
  overallSentiment?: 'positive' | 'negative' | 'neutral'; // 블로그 전체 감성
  relevanceScore: number; // 사용자 요청과의 관련성 점수 (초기 목업에서는 임의 값)
  embedding?: number[]; // 블로그 요약 또는 핵심 엔티티의 임베딩 (향후 구현)
}

export interface UserContext {
  location?: string;
  interests?: string;
  // 필요한 다른 사용자 컨텍스트 필드 추가
}

// BlogAnalyzerAgent에 특화된 입력 인터페이스
export interface BlogAnalyzerInput extends BaseAgentInput {
  userContext: UserContext;
  // location은 BaseAgentInput에 이미 포함되어 있음
}

// BlogAnalyzerAgent에 특화된 출력 인터페이스
export interface BlogAnalyzerOutput extends BaseAgentOutput {
  data: AnalyzedBlogResult[]; // 블로그 분석 결과 데이터
}

export interface RawBlogData {
  url: string;
  title: string;
  content: string;
}
