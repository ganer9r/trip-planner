import { json } from '@sveltejs/kit';

import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import type { PromptConfig } from '$lib/lib/ai/type';
import { langfuse, langfuseLangchainHandler } from '$lib/lib/ai/langfuse';
import { getModel } from '$lib/lib/ai/model.js';
import type { TextPromptClient } from 'langfuse';
import { TravelPlanSchema } from '$lib/lib/domain/plan/type';

// 요청 타입 정의
interface RequestData {
  messages?: Array<{ role: string; content: string }>;
  [key: string]: unknown;
}

// langfuseTrace 인터페이스 정의
interface LangfuseTrace {
  update: (data: { status: string; statusMessage: string }) => void;
  flushAsync: () => Promise<void>;
}

// POST API 엔드포인트 (여행 계획 생성 + 채팅 - 랭퓨즈 기반)
export async function POST({ request }) {
  try {
    const contentType = request.headers.get('content-type');
    
    if (!contentType?.includes('application/json')) {
      return json({ error: '지원되지 않는 콘텐츠 타입입니다.' }, { status: 415 });
    }
    
    const requestData = await request.json();
    
    // 랭퓨즈를 사용한 요청 처리
    return handleLangfuseRequest(requestData);
  } catch (error) {
    console.error('API 처리 오류:', error);
    return json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

async function getPromptTemplate(prompt: TextPromptClient) {
  const promptMessages = prompt.getLangchainPrompt();
  const messagesArray = Array.isArray(promptMessages) ? promptMessages : [promptMessages];
  
  const promptTemplate = ChatPromptTemplate.fromMessages(messagesArray).withConfig({
    metadata: { langfusePrompt: prompt }
  });
  
  return promptTemplate;
}

async function getModelWithStructuredOutput(promptConfig: PromptConfig) {
  const model = getModel(promptConfig);
  return model.withStructuredOutput(TravelPlanSchema, {includeRaw: true});
}

// 랭퓨즈를 이용한 요청 핸들러
async function handleLangfuseRequest(requestData: RequestData) {
  try {
    // 필수 파라미터 확인
    if (!requestData) {
      return json({ error: '요청 데이터가 없습니다.' }, { status: 400 });
    }

    const prompt = await langfuse.getPrompt('travel-planner');
    const promptTemplate = await getPromptTemplate(prompt);

    const promptConfig = (prompt.config || {}) as PromptConfig;
    const modelWithStructuredOutput = await getModelWithStructuredOutput(promptConfig);

    // 체인 생성
    const chain = RunnableSequence.from([promptTemplate, modelWithStructuredOutput]);

    // 체인 실행 및 Langfuse 콜백 적용
    const result = await chain.invoke(
      requestData,
      { callbacks: [langfuseLangchainHandler] } // Langfuse 콜백 핸들러 전달
    );

    // 결과 반환
    if (requestData.messages) {
      // 채팅 모드 응답
      return json({
        message: {
          role: 'assistant',
          content: result.content.toString(),
          timestamp: new Date()
        }
      });
    } else {
      // 여행 계획 생성 모드 응답
      return json({
        travel_plan: result
      });
    }

  } catch (error: unknown) {
    console.error('요청 처리 오류:', error);

    return json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}