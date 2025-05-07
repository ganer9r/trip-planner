import { langfuse, langfuseLangchainHandler } from "$src/lib/ai/langfuse";
import { getModel } from "$src/lib/ai/model";
import type { PromptConfig } from "$src/lib/ai/type";
import { TravelPlanSchema, type TravelPlan, type TravelPlanUpdateRequest } from "$src/lib/domain/plan/type";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { error } from "@sveltejs/kit";
import type { TextPromptClient } from "langfuse";

export async function handleUpdatePlanLangfuseRequest(requestData: TravelPlanUpdateRequest): Promise<TravelPlan | undefined> {
  // await new Promise(resolve => setTimeout(resolve, 5000));
  // return mockPlan;

  try {
    // 필수 파라미터 확인
    if (!requestData) {
      error(400, '요청 데이터가 없습니다.');
    }

    const prompt = await langfuse.getPrompt('travel-planner-modifier');
    const promptTemplate = await getMakePlanPromptTemplate(prompt);

    const promptConfig = (prompt.config || {}) as PromptConfig;
    const modelWithStructuredOutput = await getModelWithStructuredOutput(promptConfig);

    // 체인 생성
    const chain = RunnableSequence.from([promptTemplate, modelWithStructuredOutput]);
    const result = await chain.invoke(
      {
        plan: requestData.plan,
        user_feedback: requestData.feedback,
        //
        location: requestData.travelRequest.location,
        date_ranges: `${requestData.travelRequest.startDate} - ${requestData.travelRequest.endDate}`,
        keywords: requestData.travelRequest.keywords,
        transportation: requestData.travelRequest.transportation,
        //
        style: requestData.travelRequest.style,
        companion: requestData.travelRequest.companion,
      },
      { callbacks: [langfuseLangchainHandler],         
        metadata: {
          langfuseSessionId: requestData.travelRequest.planId,
        }
      }
    );

    // 결과 반환
    if (result) {
      return result as TravelPlan;
    }
  } catch (e: unknown) {
    console.error('요청 처리 오류:', e);
    error(500, '요청을 처리하는 중 오류가 발생했습니다.');
  }
}

async function getMakePlanPromptTemplate(prompt: TextPromptClient) {
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


const mockPlan: TravelPlan = {
	"title": "사가 여행 계획",
	"overview": "사가에서 힐링을 즐기며 여유로운 시간을 보내는 여행 일정",
	"assistantMessage": "사가 여행 계획이 수정되었습니다. 수정 사항에 만족하시는지 확인해주세요.",
	"days": [{
			"date": "2025년 05월 26일",
			"morning": "사가의 대표적인 온천 중 하나인 공양온천에서 힐링",
			"lunch": "공양온천 근처 맛집에서 지역 특색 있는 음식 즐기기",
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