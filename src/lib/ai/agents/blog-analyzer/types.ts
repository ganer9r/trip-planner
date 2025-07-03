import type { BaseAgentInput, BaseAgentOutput } from '../core';

// 1. 블로그 원문 데이터
export interface RawBlogData {
  url: string;
  title: string;
  content: string;
}

// 2. 블로그를 분석한 중간 결과물
export interface AnalyzedBlogResult {
  originalUrl: string;
  title: string;
  summary: string;
  extractedEntities: {
    name: string;
    type: 'place' | 'activity' | 'restaurant' | 'hotel' | 'tip';
    description: string;
    keywords?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
    score?: number; // 0-10 사이의 중요도 점수
  }[];
}

// 3. 최종적으로 반환될, 순위가 매겨진 장소
export interface RankedPlace {
  name: string;
  score: number;
  description: string;
  keywords?: string[];
  sourceUrl: string; // 출처 블로그 URL
}

// Agent의 입출력 타입
export interface UserContext {
  location?: string;
  interests?: string;
}

export interface BlogAnalyzerInput extends BaseAgentInput {
  userContext: UserContext;
}

export interface BlogAnalyzerOutput extends BaseAgentOutput {
  data: RankedPlace[];
}
