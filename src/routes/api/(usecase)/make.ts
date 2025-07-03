import { langfuse } from "$src/lib/ai/langfuse";
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
    });

    // AgentExecutor 실행을 Langfuse 스팬으로 감싸기
    const agentSpan = trace.span({
      name: "agent-execution",
      input: { requestData },
    });

    // 날짜 범위를 문자열로 변환
    const dateRanges = `${requestData.startDate}부터 ${requestData.endDate}까지`;
    
    const result = await agentExecutor.invoke({
      location: requestData.location,
      date_ranges: dateRanges,
      keywords: requestData.keywords,
      transportation: requestData.transportation,
      companion: requestData.companion,
      style: requestData.style,
    });

    agentSpan.update({ output: result });
    agentSpan.end();

    // AgentExecutor의 output 속성에서 최종 결과 추출
    const finalStructuredPlan = result.output;

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