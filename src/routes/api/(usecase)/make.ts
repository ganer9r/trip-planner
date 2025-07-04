import { langfuse, langfuseLangchainHandler } from "$src/lib/ai/langfuse";
import { TravelPlanSchema, type TravelPlan, type TravelPlanRequest } from "$src/lib/domain/plan/type";
import { error } from "@sveltejs/kit";
import { WeatherAgent } from "$src/lib/ai/agents/weather/agent";
import { DynamicStructuredTool } from '@langchain/core/tools';
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";

import { z } from 'zod';
import type { TextPromptClient } from "langfuse";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import type { PromptConfig } from "$src/lib/ai/type";
import { getModel } from "$src/lib/ai/model";

// AgentExecutor 중간 단계 타입 정의
interface AgentStep {
  action: {
    tool: string;
    toolInput: unknown;
  };
  observation: unknown;
}

// 최종 구조화된 출력을 위한 도구 정의
class FinalPlanTool {
  tool() {
    return new DynamicStructuredTool({
      name: 'output_travel_plan',
      description: 'Call this tool with the complete and final structured travel plan in JSON format, adhering strictly to the TravelPlanSchema. This is the final step after gathering all necessary information and formulating the plan.',
      schema: TravelPlanSchema,
      func: async (plan: z.infer<typeof TravelPlanSchema>) => {
        console.log('✅ LLM called output_travel_plan tool with structured plan.');
        return plan;
      },
    });
  }
}

export async function handleMakePlanLangfuseRequest(requestData: TravelPlanRequest): Promise<TravelPlan | undefined> {
  // Langfuse 추적 시작
  const trace = langfuse.trace({
    name: "make-travel-plan-agent",
    input: requestData,
  });

  try {
    if (!requestData) {
      error(400, '요청 데이터가 없습니다.');
    }

    console.log('🚀 여행 계획 생성 시작 (단일 LLM 호출 - AgentExecutor + Structured Output Tool - Langfuse 통합):', {
      location: requestData.location,
      startDate: requestData.startDate,
      endDate: requestData.endDate
    });

    console.log('🔧 AgentExecutor를 사용하여 정보 수집 및 최종 구조화된 계획 생성 중...');

    // const blogAgent = new BlogAnalyzerAgent();
    const weatherAgent = new WeatherAgent();
    const finalPlanTool = new FinalPlanTool();

    const tools = [
      weatherAgent.tool(),
      // blogAgent.tool(),
      finalPlanTool.tool()
    ];

    // Langfuse에서 프롬프트 가져오기 및 모델 설정
    const prompt = await langfuse.getPrompt('travel-planner');
    const promptTemplate = await getMakePlanPromptTemplate(prompt);
    const promptConfig = (prompt.config || {}) as PromptConfig;
    
    // getModel 함수를 사용하여 LLM 인스턴스 가져오기
    const agentLlm = getModel(promptConfig);

    const agent = await createOpenAIFunctionsAgent({
      llm: agentLlm,
      tools,
      prompt: promptTemplate,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      verbose: true,
      returnIntermediateSteps: true,
    });

    // AgentExecutor 실행을 Langfuse 스팬으로 감싸기
    const agentSpan = trace.span({
      name: "agent-execution",
      input: { requestData },
    });

    // 날짜 범위를 문자열로 변환
    const dateRanges = `${requestData.startDate}부터 ${requestData.endDate}까지`;
    
    console.log('🔄 1차 LLM 호출: AgentExecutor 실행 시작...');
    const result = await agentExecutor.invoke({
      location: requestData.location,
      date_ranges: dateRanges,
      keywords: requestData.keywords,
      transportation: requestData.transportation,
      companion: requestData.companion,
      style: requestData.style,
    }, {
      callbacks: [langfuseLangchainHandler]
    });

    agentSpan.update({ output: result });
    agentSpan.end();

    // 중간 단계에서 output_travel_plan 도구 호출 여부 확인
    const intermediateSteps = result.intermediateSteps || [];
    const outputToolUsed = intermediateSteps.some((step: AgentStep) => 
      step.action?.tool === 'output_travel_plan'
    );

    let finalStructuredPlan;

    if (outputToolUsed) {
      console.log('✅ output_travel_plan 도구 호출됨. 총 LLM 호출: 1회');
      // output_travel_plan 도구가 사용된 경우, 해당 결과를 찾아서 반환
      const outputStep = intermediateSteps.find((step: AgentStep) => 
        step.action?.tool === 'output_travel_plan'
      );
      finalStructuredPlan = outputStep?.observation;
    } else {
      // output_travel_plan 도구가 사용되지 않은 경우, 강제로 도구 호출
      console.log('⚠️ output_travel_plan 도구가 호출되지 않음. 2차 LLM 호출 시도...');
      
      // 텍스트 결과를 바탕으로 구조화된 계획 생성 시도
      const textOutput = result.output;
      
      try {
        // withStructuredOutput을 사용한 후처리
        const parseSpan = trace.span({
          name: "text-to-structured-parsing",
          input: { textOutput }
        });
        
        finalStructuredPlan = await parseTextToStructuredPlan(textOutput, requestData, promptConfig);
        console.log('✅ 2차 LLM 호출 완료. 총 LLM 호출: 2회');
        
        parseSpan.update({ output: finalStructuredPlan });
        parseSpan.end();
      } catch (parseError) {
        console.error('텍스트 파싱 실패:', parseError);
        console.log('🔄 Fallback 계획 생성 (추가 LLM 호출 없음)');
        
        // 파싱 실패 시 기본 계획 생성
        finalStructuredPlan = createFallbackPlan(textOutput, requestData);
      }
    }

    if (finalStructuredPlan) {
      console.log('✅ 최종 구조화된 여행 계획 생성 완료 (단일 LLM 호출)');
      trace.update({ output: finalStructuredPlan });
      return finalStructuredPlan as TravelPlan;
    }
    
    trace.update({ output: "No plan generated" });
    return undefined;

  } catch (e: unknown) {
    console.error('요청 처리 오류:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
    trace.update({ output: { error: errorMessage } });
    error(500, '요청을 처리하는 중 오류가 발생했습니다.');
  } finally {
    await langfuse.flushAsync();
  }
}

async function getMakePlanPromptTemplate(prompt: TextPromptClient) {
  const promptData = prompt.getLangchainPrompt();
  console.log('🔍 PromptTemplate:', promptData);
  
  // promptData의 타입에 따라 적절히 처리
  let promptTemplate: ChatPromptTemplate;
  
  if (Array.isArray(promptData)) {
    // 배열 형태의 메시지를 그대로 사용 (agent_scratchpad 추가 안함)
    promptTemplate = ChatPromptTemplate.fromMessages(promptData);
  } else {
    // 문자열 형태의 템플릿을 그대로 사용
    promptTemplate = ChatPromptTemplate.fromTemplate(promptData);
  }

  return promptTemplate;
}

// 텍스트를 구조화된 계획으로 변환하는 함수
async function parseTextToStructuredPlan(
  textOutput: string, 
  requestData: TravelPlanRequest,
  promptConfig: PromptConfig
): Promise<TravelPlan> {
  // 별도의 LLM 호출로 텍스트를 구조화
  const model = getModel(promptConfig);
  const structuredModel = model.withStructuredOutput(TravelPlanSchema);
  
  const parsePrompt = `다음 텍스트 여행 계획을 TravelPlanSchema에 맞는 JSON 구조로 변환해주세요:

${textOutput}

원본 요청 정보:
- 위치: ${requestData.location}
- 시작일: ${requestData.startDate}  
- 종료일: ${requestData.endDate}
- 스타일: ${requestData.style}`;

  return await structuredModel.invoke(parsePrompt, {
    callbacks: [langfuseLangchainHandler]
  });
}

// 기본 계획을 생성하는 함수
function createFallbackPlan(textOutput: string, requestData: TravelPlanRequest): TravelPlan {
  return {
    title: `${requestData.location} 여행 계획`,
    overview: "AI가 생성한 맞춤형 여행 계획입니다.",
    assistantMessage: "이 일정이 마음에 드시나요? 수정하고 싶은 부분이 있으시면 말씀해 주세요.",
    days: [
      {
        date: requestData.startDate,
        morning: "여행지 도착 및 체크인",
        lunch: "현지 맛집 탐방",
        afternoon: "주요 관광지 방문",
        evening: "자유 시간"
      }
    ],
    references: [],
    planId: requestData.planId
  };
}