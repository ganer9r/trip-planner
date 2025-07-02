# Todo: Blog Analyzer 개발 계획

## 1. 목표
블로그 본문 텍스트를 입력받아 여행 계획 생성에 필요한 핵심 정보를 추출하고 구조화하여 반환하는 `Blog Analyzer` 모듈을 개발합니다. 초기에는 목업 데이터를 사용하여 기능을 검증하고, 최종적으로 Supabase에 분석 결과를 저장하도록 구현합니다.

## 2. 입력 (Input)
*   **원시 블로그 데이터:** `searchBlogTool`에서 수집한 블로그 본문 텍스트 (현재는 `mockBlogData`의 `content` 필드).
*   **사용자 요청 컨텍스트 (선택 사항):** 사용자의 관심사, 목적지 등 (분석의 관련성을 높이는 데 활용될 수 있음).

## 3. 출력 (Output)
각 블로그에 대해 다음과 같은 구조화된 정보를 반환합니다. (향후 Supabase 테이블 스키마의 기반이 됨)

```typescript
interface AnalyzedBlogResult {
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
```

## 4. 핵심 로직 (Mock 처리)

### 4.1. `src/lib/ai/agents/core.ts` 정의
*   모든 에이전트가 상속받을 `Agent` 추상 클래스, `AgentInput`, `AgentOutput` 인터페이스를 정의합니다.

### 4.2. `Blog Analyzer` 도메인 모듈 구현 (Mock)
*   **`src/lib/ai/agents/blog-analyzer/types.ts`**: `AnalyzedBlogResult`, `UserContext`, `BlogAnalyzerInput`, `BlogAnalyzerOutput` 인터페이스 정의.
*   **`src/lib/ai/agents/blog-analyzer/logic.ts`**: 블로그 콘텐츠 분석(`BlogContentAnalyzer`) 및 스코어링(`BlogScorer`) 로직 구현.
*   **`src/lib/ai/agents/blog-analyzer/data-access.ts`**: 블로그 원시 데이터 접근 인터페이스(`IRawBlogDataSource`) 및 목업 구현체(`MockRawBlogDataSource`) 정의.
*   **`src/lib/ai/agents/blog-analyzer/agent.ts`**: `Agent` 추상 클래스를 상속받는 `BlogAnalyzerAgent` 클래스 구현. `run()` 메서드에서 `logic`과 `data-access`의 모듈들을 조율하여 블로그 분석 파이프라인을 오케스트레이션합니다.
*   **`src/lib/ai/agents/blog-analyzer/agent.spec.ts`**: `BlogAnalyzerAgent` 및 관련 모듈 테스트 코드 작성.

### 4.3. `searchBlogTool` 수정
*   `src/lib/ai/agents/blog-analyzer/searchBlogTool.ts` 파일 수정.
*   `searchBlogTool`의 `_searchBlogs` 함수를 수정하여, `BlogAnalyzerAgent` 클래스를 인스턴스화하고 `run()` 메서드를 호출하도록 변경합니다.

## 5. 통합 (Integration)

### 5.1. `src/routes/api/(usecase)/make.ts` 수정
*   `handleMakePlanLangfuseRequest` 함수 내에서 `searchBlogTool`이 반환하는 `AnalyzedBlogResult[]` 배열을 받습니다.
*   이 분석된 블로그 정보를 LLM 프롬프트에 포함시킬 때, 원시 블로그 본문 대신 `summary`와 `extractedEntities`를 활용하여 더 간결하고 구조화된 정보를 전달합니다.
*   LLM이 `references` 필드를 채울 때 `AnalyzedBlogResult`의 `originalUrl`과 `title`을 사용하도록 지시합니다.

## 6. Supabase 연동 (Mock 처리) - (향후 `query.ts` 등으로 처리 예정)

### 6.1. Supabase 클라이언트 목업 (제거됨)

### 6.2. `Blog Analyzer`에서 Supabase 목업 사용 (제거됨)

## 7. 향후 개선 (Future Enhancements)
*   **실제 LLM 기반 분석:** `Blog Analyzer` 내부에서 LLM을 호출하여 실제 요약, 엔티티 추출, 감성 분석 등을 수행하도록 고도화.
*   **실제 Supabase 연동:** `supabase-js` 라이브러리를 사용하여 실제 Supabase DB에 연결하고 데이터를 저장/조회.
*   **벡터 DB 연동:** `embedding` 필드를 실제 임베딩 벡터로 채우고, Supabase의 `pgvector` 확장 또는 별도의 벡터 DB에 저장하여 의미론적 검색 구현.
*   **스코어링 로직 고도화:** 사용자 컨텍스트를 기반으로 `relevanceScore`를 동적으로 계산하는 로직 구현.
*   **주기적인 블로그 수집/분석 파이프라인:** 별도의 스케줄러(예: Cron Job, Cloud Function)를 사용하여 블로그를 주기적으로 수집하고 분석하여 DB를 업데이트.

---

## 8. 작업 리스트

*   [x] **`src/lib/ai/agents/core.ts` 정의** - 난이도: Easy
    *   모든 에이전트가 상속받을 `Agent` 추상 클래스, `AgentInput`, `AgentOutput` 인터페이스를 정의합니다.

*   [x] **`Blog Analyzer` 도메인 모듈 구현 (Mock)** - 난이도: Hard
    *   **`src/lib/ai/agents/blog-analyzer/types.ts`**: `AnalyzedBlogResult`, `UserContext`, `BlogAnalyzerInput`, `BlogAnalyzerOutput` 인터페이스 정의.
    *   **`src/lib/ai/agents/blog-analyzer/logic.ts`**: 블로그 콘텐츠 분석(`BlogContentAnalyzer`) 및 스코어링(`BlogScorer`) 로직 구현.
    *   **`src/lib/ai/agents/blog-analyzer/data-access.ts`**: 블로그 원시 데이터 접근 인터페이스(`IRawBlogDataSource`) 및 목업 구현체(`MockRawBlogDataSource`) 정의.
    *   **`src/lib/ai/agents/blog-analyzer/agent.ts`**: `Agent` 추상 클래스를 상속받는 `BlogAnalyzerAgent` 클래스 구현. `run()` 메서드에서 `logic`과 `data-access`의 모듈들을 조율하여 블로그 분석 파이프라인을 오케스트레이션합니다.
    *   **`src/lib/ai/agents/blog-analyzer/agent.spec.ts`**: `BlogAnalyzerAgent` 및 관련 모듈 테스트 코드 작성.

*   [x] **`searchBlogTool` 수정** - 난이도: Easy
    *   `src/lib/ai/agents/blog-analyzer/searchBlogTool.ts` 파일 수정.
    *   `searchBlogTool`의 `_searchBlogs` 함수를 수정하여, `BlogAnalyzerAgent` 클래스를 인스턴스화하고 `run()` 메서드를 호출하도록 변경합니다.

*   [ ] **`make.ts` 통합** - 난이도: Medium
    *   `src/routes/api/(usecase)/make.ts` 파일 수정.
    *   `handleMakePlanLangfuseRequest` 함수 내에서 `searchBlogTool`이 반환하는 `AnalyzedBlogResult[]` 배열을 받도록 변경.
    *   이 분석된 블로그 정보를 LLM 프롬프트에 포함시킬 때, 원시 블로그 본문 대신 `summary`와 `extractedEntities`를 활용하여 더 간결하고 구조화된 정보를 전달하도록 로직 추가.
    *   LLM이 `references` 필드를 채울 때 `AnalyzedBlogResult`의 `originalUrl`과 `title`을 사용하도록 지시.
