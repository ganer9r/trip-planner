// src/lib/ai/agents.ts
import { openaiClient, OPENAI_MODEL } from './llm'; // OpenAI 클라이언트 및 모델 이름 임포트
import { langfuse } from './langfuse'; // LangFuse 클라이언트
import type { Trace } from 'langfuse-node'; // LangFuse Trace 타입 임포트
// Prompts.ts 파일은 더 이상 사용하지 않으므로 삭제 가능
import type { TravelPlanRequest, TravelPlanResult, CityOption } from '../types';
// OpenAI Chat Completions API 타입 임포트 (필요시)
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';


// --- JSON 파싱 헬퍼 ---
// LLM 응답에서 JSON을 안전하게 파싱하는 헬퍼 함수 (마크다운 코드 블록 포함)
async function safeJsonParse<T>(text: string): Promise<T> {
     try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
            console.log("마크다운 코드 블록에서 JSON 추출 성공");
            return JSON.parse(jsonMatch[1]) as T;
        }

        console.log("마크다운 코드 블록 없음. 직접 JSON 파싱 시도");
        return JSON.parse(text) as T;

    } catch (error) {
        console.error('JSON 파싱 오류:', error);
        console.error('파싱 대상 텍스트:', text);
        throw new Error(`AI 응답을 JSON으로 파싱하는 데 실패했습니다: ${(error as Error).message}`);
    }
}

// --- 에이전트 함수 (OpenAI + LangFuse 연동) ---

// 에이전트 1: 도시 연구 태스크
export async function researchCitiesTask(
    destination: string,
    interests: string,
    parentObservation: Trace // LangFuse Trace 또는 Span 타입
): Promise<CityOption[]> {
    console.log('에이전트: 도시 연구 중...');

    const span = parentObservation.span({
        name: "research-cities-task",
        input: { destination, interests },
        metadata: { role: "Researcher Agent" }
    });

    try {
        // 1. LangFuse에서 프롬프트 가져오기 (ChatML 형식)
        const promptName = "research-cities"; // LangFuse UI에 정의된 프롬프트 이름
        const promptVariables = { destination, interests }; // 프롬프트 변수
        const promptObject = await langfuse.getPrompt(promptName);
        // LangFuse ChatML 프롬프트 컴파일 시 메시지 배열 반환
        const messages: ChatCompletionMessageParam[] = promptObject.compile(promptVariables);
        console.log(`LangFuse에서 프롬프트 '${promptName}' (버전 ${promptObject.version}) 로드 완료`);

        // 스팬 입력에 실제 사용된 메시지 추가
        span.update({ input: { ...promptVariables, messages } });


        // 2. LLM 호출 (OpenAI Chat Completion) 및 LangFuse에 보고
        const llmCall = span.llm({
            model: OPENAI_MODEL, // 사용한 모델 이름 (gpt-3.5-turbo)
            input: messages, // LLM에게 보낸 입력 메시지 배열
            metadata: { type: "chat-completion", tool: "openai" } // LLM 호출 메타데이터
        });

        // 실제 OpenAI 모델 호출
        const completion = await openaiClient.chat.completions.create({
            model: OPENAI_MODEL,
            messages: messages,
            response_format: { type: "json_object" } // OpenAI 최신 모델은 JSON 강제 모드 지원
            // temperature: 0.7, // 필요시 설정
        });

        const text = completion.choices[0].message.content || ''; // 응답 내용 추출
        console.log("LLM 원본 응답:", text);

        // LLM 호출 결과 보고
        llmCall.end({ output: text });


        // 3. LLM 응답 파싱 (JSON)
        const parsedResponse = await safeJsonParse<{ cities: CityOption[] }>(text);

        // 파싱된 데이터 유효성 검사
        if (!parsedResponse || !parsedResponse.cities || parsedResponse.cities.length === 0) {
            console.warn('도시 연구 결과가 없거나 예상치 못한 형식입니다:', parsedResponse);
            span.error({ message: '도시 연구 결과가 없거나 예상치 못한 형식입니다.' });
            throw new Error('제시된 조건에 맞는 적절한 도시를 찾을 수 없습니다.');
        }

        // LangFuse 스팬 종료 및 최종 결과 기록
        span.end({ output: parsedResponse.cities });
        console.log('에이전트: 도시 연구 완료');
        return parsedResponse.cities;

    } catch (error: any) {
        console.error('researchCitiesTask 실행 중 오류 발생:', error);
        span.error({ message: error.message, stack: error.stack });
        await span.end();
        throw error;
    }
}

// 에이전트 2: 도시 선택 태스크
export async function selectCityTask(
     cities: CityOption[],
     interests: string,
     travelers: number,
     parentObservation: Trace // LangFuse Trace 또는 Span 타입
): Promise<string> {
     console.log('에이전트: 최적 도시 선택 중...');

     const span = parentObservation.span({
         name: "select-city-task",
         input: { cities, interests, travelers },
         metadata: { role: "Selector Agent" }
     });

     try {
         // 1. LangFuse에서 프롬프트 가져오기 (ChatML 형식)
         const promptName = "select-city";
         const promptVariables = { citiesJson: JSON.stringify({ cities }), interests, travelers };
         const promptObject = await langfuse.getPrompt(promptName);
         const messages: ChatCompletionMessageParam[] = promptObject.compile(promptVariables);
         console.log(`LangFuse에서 프롬프트 '${promptName}' (버전 ${promptObject.version}) 로드 완료`);

         span.update({ input: { ...promptVariables, messages } });


         // 2. LLM 호출 (OpenAI Chat Completion) 및 LangFuse에 보고
         const llmCall = span.llm({
             model: OPENAI_MODEL,
             input: messages,
             metadata: { type: "chat-completion", tool: "openai" }
         });

         const completion = await openaiClient.chat.completions.create({
             model: OPENAI_MODEL,
             messages: messages,
             // response_format: { type: "text" } // 텍스트 응답을 원하므로 JSON 강제 안 함
             // temperature: 0.5, // 필요시 설정 (도시 선택은 좀 더 결정적이어야 할 수 있음)
         });

         const selectedCity = completion.choices[0].message.content?.trim() || ''; // 응답 내용 추출 및 공백 제거
         console.log("LLM 원본 응답 (도시 선택):", selectedCity);

         llmCall.end({ output: selectedCity });


         // 3. 결과 유효성 검사
         // 도시 이름이 비어있거나, 에러 메시지 같거나, 너무 길면 유효하지 않다고 간주
         if (!selectedCity || selectedCity.toLowerCase().includes('error') || selectedCity.length > 100) {
             console.warn('도시 선택 결과가 예상치 못했습니다:', selectedCity);
              span.error({ message: '도시 선택 결과가 예상치 못했습니다.' });
            throw new Error('제시된 선택지에서 특정 도시를 선택할 수 없습니다.');
         }

         span.end({ output: selectedCity });
         console.log('에이전트: 도시 선택 완료');
         return selectedCity;

     } catch (error: any) {
         console.error('selectCityTask 실행 중 오류 발생:', error);
         span.error({ message: error.message, stack: error.stack });
         await span.end();
         throw error;
     }
 }

// 에이전트 3: 여행 계획 생성 태스크
export async function generateItineraryTask(
    request: TravelPlanRequest,
    selectedCity: string,
    parentObservation: Trace // LangFuse Trace 또는 Span 타입
): Promise<TravelPlanResult> {
     console.log('에이전트: 여행 계획 생성 중...');

     const span = parentObservation.span({
         name: "generate-itinerary-task",
         input: { request, selectedCity },
         metadata: { role: "Planner Agent" }
     });

    try {
        // 1. LangFuse에서 프롬프트 가져오기 (ChatML 형식)
        const promptName = "generate-itinerary";
        // request 객체 전체와 selectedCity를 변수로 전달
        const promptVariables = { request, selectedCity };
        const promptObject = await langfuse.getPrompt(promptName);
        const messages: ChatCompletionMessageParam[] = promptObject.compile(promptVariables);
        console.log(`LangFuse에서 프롬프트 '${promptName}' (버전 ${promptObject.version}) 로드 완료`);

        span.update({ input: { ...promptVariables, messages } });


        // 2. LLM 호출 (OpenAI Chat Completion) 및 LangFuse에 보고
         const llmCall = span.llm({
             model: OPENAI_MODEL,
             input: messages,
             metadata: { type: "chat-completion", format: "json", tool: "openai" }
         });

        const completion = await openaiClient.chat.completions.create({
            model: OPENAI_MODEL,
            messages: messages,
            response_format: { type: "json_object" } // JSON 응답 강제
            // temperature: 0.8, // 필요시 설정
        });

        const text = completion.choices[0].message.content || '';
        console.log("LLM 원본 응답 (여행 계획):", text);

        llmCall.end({ output: text });


        // 3. LLM 응답 파싱 (JSON)
        const planResult = await safeJsonParse<TravelPlanResult>(text);


        // 4. 파싱된 데이터 유효성 검사
         if (!planResult || !planResult.summary || !planResult.itinerary || planResult.itinerary.length === 0) {
             console.warn('여행 계획 생성 결과가 없거나 예상치 못한 형식입니다:', planResult);
              span.error({ message: '여행 계획 생성 결과가 없거나 예상치 못한 형식입니다.' });
            throw new Error('상세한 여행 계획을 생성하는 데 실패했습니다.');
         }

         // 응답 데이터의 date 필드가 YYYY-MM-DD 형식인지 확인 또는 변환 필요 (LLM이 틀릴 수 있음)
         // 간단한 유효성 검사 추가 (필요시 더 엄격하게)
         if (planResult.itinerary.some(item => !/^\d{4}-\d{2}-\d{2}$/.test(item.date))) {
              console.warn("일부 날짜 형식이 올바르지 않습니다.", planResult.itinerary);
              // 오류로 처리하거나, 형식을 수정하는 로직 추가 가능
              // span.error({ message: '생성된 계획의 날짜 형식이 올바르지 않습니다.' });
              // throw new Error('생성된 계획의 날짜 형식이 올바르지 않습니다.');
              // 여기서는 경고만 하고 계속 진행합니다.
         }


         span.end({ output: planResult });
         console.log('에이전트: 여행 계획 생성 완료');
         return planResult;

    } catch (error: any) {
        console.error('generateItineraryTask 실행 중 오류 발생:', error);
        span.error({ message: error.message, stack: error.stack });
        await span.end();
        throw error;
    }
}