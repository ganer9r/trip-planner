import { json } from '@sveltejs/kit';

import { TravelPlanRequestSchema, TravelPlanUpdateRequestSchema, type TravelPlan } from '$lib/domain/plan/type';
import type { ChattingMessage } from '$src/lib/types';
import { handleMakePlanLangfuseRequest } from './(usecase)/make';
import { handleUpdatePlanLangfuseRequest } from './(usecase)/update';

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
    console.log('data', data);
    const result = await handleMakePlanLangfuseRequest(data);
    const messages = getMessages(result);

    return json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('API 처리 오류:', error);
    return json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT({ request }) {
  try {
    const requestData = await request.json();
   
    const travelPlanRequest = TravelPlanUpdateRequestSchema.safeParse(requestData);
    if (!travelPlanRequest.success) {
      //TODO: 에러타입 ApiError와 같은 형식으로 정의해서 맞춰야 함.
      return json({ 
        title: '요청 데이터가 유효하지 않습니다.', 
        errors: travelPlanRequest.error.message 
      }, { status: 400 });
    }

    const data = travelPlanRequest.data;
    const result = await handleUpdatePlanLangfuseRequest(data);
    const messages = getMessages(result);
    
    return json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('API 처리 오류:', error);
    return json({ error: '요청을 처리하는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

function getMessages(result: TravelPlan | undefined) {
  if (!result) {
    return [];
  }

  const messages: ChattingMessage[] = [
    {
      role: 'plan',
      content: result,
      timestamp: new Date()
    },
    {
      role: 'assistant',
      content: result.assistantMessage,
      timestamp: new Date()
    },
  ];

  return messages;
}
