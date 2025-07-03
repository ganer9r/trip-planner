import { langfuse } from "$src/lib/ai/langfuse";
import { getModel } from "$src/lib/ai/model";
import type { PromptConfig } from "$src/lib/ai/type";
import { TravelPlanSchema, type TravelPlan, type TravelPlanRequest } from "$src/lib/domain/plan/type";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { error } from "@sveltejs/kit";
import { WeatherAgent } from "$src/lib/ai/agents/weather/agent";
import { BlogAnalyzerAgent } from "$src/lib/ai/agents";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
// import { ChatOpenAI } from "@langchain/openai"; // 직접 임포트 대신 getModel 사용
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

// 최종 구조화된 출력을 위한 도구 정의
class FinalPlanTool {
  tool() {
    return new DynamicStructuredTool({
      name: 'output_travel_plan',
      description: 'Call this tool with the complete and final structured travel plan in JSON format, adhering strictly to the TravelPlanSchema. This is the final step after gathering all necessary information and formulating the plan.',
      schema: TravelPlanSchema, // TravelPlanSchema를 도구의 입력 스키마로 사용
      func: async (plan: z.infer<typeof TravelPlanSchema>) => {
        console.log('✅ LLM called output_travel_plan tool with structured plan.');
        return plan; // 객체 자체를 반환
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

    const blogAgent = new BlogAnalyzerAgent();
    const weatherAgent = new WeatherAgent();
    const finalPlanTool = new FinalPlanTool();

    const tools = [
      weatherAgent.tool(),
      blogAgent.tool(),
      finalPlanTool.tool()
    ];

    // Langfuse에서 프롬프트 가져오기 및 모델 설정
    const prompt = await langfuse.getPrompt('travel-planner');
    const promptConfig = (prompt.config || {}) as PromptConfig;
    
    // getModel 함수를 사용하여 LLM 인스턴스 가져오기
    // getModel 함수가 Langfuse 콜백을 자동으로 주입하거나,
    // 여기서 명시적으로 콜백을 추가해야 할 수 있습니다.
    // Langchain의 Langfuse 통합은 일반적으로 LLM 생성 시 콜백을 처리합니다.
    const agentLlm = getModel(promptConfig); 

    const agentPrompt = ChatPromptTemplate.fromMessages([
      ["system", `You are an advanced travel planner. Your task is to create a comprehensive and structured travel plan.\n\nFirst, use the 'get_weather_forecast' tool to get weather information for the specified location and dates.\nThen, use the 'blog_analyzer' tool to find popular places and insights from travel blogs for the location.\n\nOnce you have gathered all necessary information and formulated the complete travel plan, you MUST call the 'output_travel_plan' tool with the final structured JSON plan. Ensure the plan strictly adheres to the provided schema. Do not output any other text or JSON outside of the tool call.`],
      ["human", "Create a travel plan for {location} from {startDate} to {endDate} with keywords {keywords} and transportation {transportation} for {companion} with style {style}."],
      ["placeholder", "{agent_scratchpad}"],
    ]);

    const agent = await createOpenAIFunctionsAgent({
      llm: agentLlm,
      tools,
      prompt: agentPrompt,
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

    const result = await agentExecutor.invoke({
      location: requestData.location,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
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
    await langfuse.flushAsync(); // 비동기적으로 Langfuse 데이터 전송
  }
}
