/**
 * 모든 에이전트의 공통 입력 인터페이스입니다.
 * 각 에이전트의 특정 입력은 이 인터페이스를 확장합니다.
 */
export interface BaseAgentInput {
  location: string; // 모든 여행 관련 에이전트가 공통적으로 가질 수 있는 필드
  // 더 이상 [key: string]: any; 를 사용하지 않습니다.
  // 구체적인 에이전트 입력은 이 인터페이스를 확장하여 정의합니다.
}

/**
 * 모든 에이전트의 공통 출력 인터페이스입니다.
 * 각 에이전트의 특정 출력은 이 인터페이스를 확장합니다.
 */
export interface BaseAgentOutput {
  status: 'success' | 'failure';
  errorMessage?: string;
  // 더 이상 [key: string]: any; 를 사용하지 않습니다。
  // 구체적인 에이전트 출력은 이 인터페이스를 확장하여 정의합니다.
}

/**
 * 모든 에이전트가 상속받아야 할 추상 클래스입니다.
 * 에이전트의 이름과 핵심 실행 로직을 정의합니다.
 * TInput은 BaseAgentInput을 확장하고, TOutput은 BaseAgentOutput을 확장해야 합니다.
 */
export abstract class Agent<TInput extends BaseAgentInput, TOutput extends BaseAgentOutput> {
  /** 에이전트의 고유한 이름 (예: 'BlogAnalyzer', 'WeatherManager') */
  abstract readonly name: string;

  /**
   * 에이전트의 핵심 실행 로직입니다。
   * @param input 에이전트 실행에 필요한 입력 데이터
   * @returns 에이전트 실행 결과
   */
  abstract run(input: TInput): Promise<TOutput>;
}
