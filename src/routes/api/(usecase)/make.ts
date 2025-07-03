import { langfuse } from "$src/lib/ai/langfuse";
import { getModel } from "$src/lib/ai/model";
import type { PromptConfig } from "$src/lib/ai/type";
import { TravelPlanSchema, type TravelPlan, type TravelPlanRequest } from "$src/lib/domain/plan/type";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { error } from "@sveltejs/kit";
import type { TextPromptClient } from "langfuse";
import { WeatherAgent } from "$src/lib/ai/agents/weather/agent";
import { BlogAnalyzerAgent } from "$src/lib/ai/agents";
import type { DailyWeatherData } from "$src/lib/ai/agents/weather/types";
import type { RankedPlace } from "$src/lib/ai/agents/blog-analyzer/types";

export async function handleMakePlanLangfuseRequest(requestData: TravelPlanRequest): Promise<TravelPlan | undefined> {
  try {
    // 필수 파라미터 확인
    if (!requestData) {
      error(400, '요청 데이터가 없습니다.');
    }

    console.log('🚀 여행 계획 생성 시작 (Enhanced Tool 방식):', {
      location: requestData.location,
      startDate: requestData.startDate,
      endDate: requestData.endDate
    });

    // 1단계: 도구들을 사용하여 정보 수집
    console.log('🔧 도구를 사용하여 정보 수집 중...');

    const blogAgent = new BlogAnalyzerAgent();
    const blogTool = blogAgent.tool();

    const weatherAgent = new WeatherAgent();
    const weatherTool = weatherAgent.tool();

    // 병렬로 도구 호출
    const [weatherInfoRaw, blogAnalysisResultsRaw] = await Promise.all([
      weatherTool.invoke({
        location: requestData.location,
        startDate: requestData.startDate,
        endDate: requestData.endDate
      }).catch(e => {
        console.error('날씨 도구 호출 실패:', e);
        return `날씨 정보를 가져올 수 없습니다: ${e}`;
      }),
      blogTool.invoke({
        location: requestData.location
      }).catch(e => {
        console.error('블로그 도구 호출 실패:', e);
        return JSON.stringify([]); // 실패 시 빈 배열 JSON 문자열 반환
      })
    ]);

    let weatherInfo: DailyWeatherData[] = [];
    if (typeof weatherInfoRaw === 'string') {
      try {
        const parsed = JSON.parse(weatherInfoRaw);
        if (Array.isArray(parsed)) {
          weatherInfo = parsed;
        } else {
          console.error('날씨 정보가 배열이 아닙니다:', parsed);
        }
      } catch (e) {
        console.error('날씨 정보 파싱 실패:', e);
      }
    }

    let blogAnalysisResults: RankedPlace[] = [];
    if (typeof blogAnalysisResultsRaw === 'string') {
      try {
        const parsed = JSON.parse(blogAnalysisResultsRaw);
        if (Array.isArray(parsed)) {
          blogAnalysisResults = parsed;
        } else {
          console.error('블로그 분석 결과가 배열이 아닙니다:', parsed);
        }
      } catch (e) {
        console.error('블로그 분석 결과 파싱 실패:', e);
      }
    }

    const formattedWeatherInfo = formatWeatherInfo(weatherInfo);
    const formattedBlogInfo = formatRankedPlaces(blogAnalysisResults);

    console.log('✅ 도구 호출 완료:', { 
      weatherInfoLength: weatherInfo.length, 
      blogInfoLength: formattedBlogInfo.length 
    });

    // 2단계: 수집된 정보를 사용하여 LLM이 여행 계획 생성
    console.log('📝 수집된 정보로 여행 계획 생성 중...');
    
    const result = await generateTravelPlanWithTools(requestData, { weatherInfo: formattedWeatherInfo, blogInfo: formattedBlogInfo });

    if (result) {
      console.log('✅ 여행 계획 생성 완료');
      return result as TravelPlan;
    }

  } catch (e: unknown) {
    console.error('요청 처리 오류:', e);
    error(500, '요청을 처리하는 중 오류가 발생했습니다.');
  }
}

async function generateTravelPlanWithTools(
  requestData: TravelPlanRequest, 
  toolResults: { weatherInfo: string, blogInfo: string }
): Promise<TravelPlan> {
  
  const prompt = await langfuse.getPrompt('travel-planner');
  const promptConfig = (prompt.config || {}) as PromptConfig;
  const model = getModel(promptConfig);

  // Enhanced prompt with tool results
  const planPrompt = await getMakePlanPromptTemplate(prompt, toolResults);
  
  // 방법 1: 기본 withStructuredOutput 사용
  const modelWithStructuredOutput = model.withStructuredOutput(TravelPlanSchema);

  const result = await planPrompt.pipe(modelWithStructuredOutput).invoke({
    location: requestData.location,
    date_ranges: `${requestData.startDate} - ${requestData.endDate}`,
    keywords: requestData.keywords,
    transportation: requestData.transportation,
    style: requestData.style,
    companion: requestData.companion,
  });

  return result as TravelPlan;
}

async function getMakePlanPromptTemplate(prompt: TextPromptClient, researchContext: { weatherInfo: string, blogInfo: string }) {
  const promptMessages = prompt.getLangchainPrompt();
  const messagesArray = Array.isArray(promptMessages) ? promptMessages : [promptMessages];
  
  const enhancedSystemMessage = `
You are an advanced travel planner with access to real-time information.

I have used specialized tools to gather the following information for you:

🌤️ WEATHER INFORMATION (from weather search tool):
${researchContext.weatherInfo}

📝 BLOG INSIGHTS (from travel blog search tool):
${researchContext.blogInfo}

Please use this tool-gathered information to create a comprehensive and accurate travel plan. 
Make sure to:
1. Reflect the actual weather conditions in your recommendations
2. Incorporate insights from the travel blogs
3. Add relevant blog references to the 'references' section if provided
4. Create a plan that's realistic given the weather and local insights

The tools have already done the research - now use their results to create the best possible travel plan.
`;

  // Prepend the enhanced system message
  const finalMessages = [['system', enhancedSystemMessage], ...messagesArray];
  
  const promptTemplate = ChatPromptTemplate.fromMessages(finalMessages).withConfig({
    metadata: { langfusePrompt: prompt }
  });
  
  return promptTemplate;
}

function formatRankedPlaces(rankedPlaces: RankedPlace[]): string {
  if (!rankedPlaces || rankedPlaces.length === 0) {
    return "추천 장소 정보가 없습니다.";
  }

  let formatted = "";
  rankedPlaces.forEach((place, index) => {
    formatted += `\n--- 추천 장소 ${index + 1} ---\n`;
    formatted += `이름: ${place.name}\n`;
    formatted += `점수: ${place.score}\n`;
    formatted += `설명: ${place.description}\n`;
    if (place.keywords && place.keywords.length > 0) {
      formatted += `키워드: ${place.keywords.join(', ')}\n`;
    }
    formatted += `출처: ${place.sourceUrl}\n`;
  });
  return formatted;
}

function formatWeatherInfo(weatherData: DailyWeatherData[]): string {
  if (!weatherData || weatherData.length === 0) {
    return "날씨 정보가 없습니다.";
  }

  let formatted = "";
  weatherData.forEach((day) => {
    formatted += `\n날짜: ${day.date}\n`;
    formatted += `최고/최저 기온: ${day.temp_high}°C / ${day.temp_low}°C\n`;
    formatted += `상태: ${day.condition}\n`;
    formatted += `강수 확률: ${day.precipitation_prob}%\n`;
  });
  return formatted;
}