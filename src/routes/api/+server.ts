import { json } from '@sveltejs/kit';

import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import type { PromptConfig } from '$lib/ai/type';
import { langfuse, langfuseLangchainHandler } from '$lib/ai/langfuse';
import { getModel } from '$lib/ai/model.js';
import type { TextPromptClient } from 'langfuse';
import { TravelPlanSchema, TravelPlanRequestSchema, type TravelPlan } from '$lib/domain/plan/type';

// 요청 타입 정의
interface RequestData {
  messages?: Array<{ role: string; content: string }>;
  [key: string]: unknown;
}

// POST API 엔드포인트 (여행 계획 생성 + 채팅 - 랭퓨즈 기반)
export async function POST({ request }) {
  try {
    const requestData = await request.json();
   
    const travelPlanRequest = TravelPlanRequestSchema.safeParse(requestData);
    if (!travelPlanRequest.success) {
      //TODO: 에러타입 ApiError와 같은 형식으로 정의해서 맞춰야 함.
      return json({ 
        title: '요청 데이터가 유효하지 않습니다.', 
        errors: travelPlanRequest.error.message 
      }, { status: 400 });
    }

    const data = travelPlanRequest.data;
    const result = await handleLangfuseRequest(data);
    return json({
      success: true,
      plan: result,
    });
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
  return model.withStructuredOutput(TravelPlanSchema);
}

async function handleLangfuseRequest(requestData: RequestData) {
  return mockPlan;
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
      {
        location: requestData.location,
        date_ranges: `${requestData.startDate} - ${requestData.endDate}`,
        keywords: requestData.keywords,
        transportation: requestData.transportation,
        
        style: requestData.style,
        companion: requestData.companion,
      },
      { callbacks: [langfuseLangchainHandler] } // Langfuse 콜백 핸들러 전달
    );

    // 결과 반환
    if (result) {
      return result as TravelPlan;
    }
  } catch (error: unknown) {
    console.error('요청 처리 오류:', error);

    return json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

const mockPlan: TravelPlan = {
  "title": "사가 여행 계획",
  "overview": "사가에서 힐링을 즐기며 여유로운 시간을 보내는 여행 일정",
  "days": [
    {
      "date": "2025년 05월 26일",
      "morning": "사가의 대표적인 온천인 우유온천에서 힐링",
      "lunch": "우유온천 근처 맛집에서 지역 특색 있는 음식 즐기기",
      "afternoon": "사가 현대미술관에서 예술 감상",
      "evening": "사가의 번화가에서 지역 맛집 탐방"
    },
    {
      "date": "2025년 05월 27일",
      "morning": "사가성에서 조용한 산책",
      "lunch": "사가성 근처에서 사가명물 음식 점심",
      "afternoon": "하루스타에서 풍경 감상",
      "evening": "사가에서 유명한 스시집에서 저녁식사"
    },
    {
      "date": "2025년 05월 28일",
      "morning": "사가의 역사를 느낄 수 있는 사가자기 박물관 방문",
      "lunch": "사가자기 박물관 근처에서 점심 식사",
      "afternoon": "사가의 전통 시장에서 쇼핑",
      "evening": "사가를 대표하는 라멘집에서 특별한 저녁식사"
    }
  ]
};