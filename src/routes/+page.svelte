<!-- src/routes/+page.svelte -->
<script lang="ts">
  import Form from './(ui)/Form.svelte';
  import { ApiError, PlanApi } from '$src/lib/domain/plan/api';
  import type { TravelPlan, TravelPlanRequest } from '$src/lib/domain/plan/type';
  import type { ChattingMessage, TravelPlanResult } from '$lib/types';
	import Plan from './(ui)/Plan.svelte';
	import dayjs from 'dayjs';
	import Chatting from './(ui)/Chatting.svelte';

  const { planId } = $props();
  const api = new PlanApi(fetch);

  // UI 상태 및 결과
  let loading = $state(false);
  let error = $state<string | null>(null);

  // 채팅 관련 상태
  let messages = $state<ChattingMessage[]>([]);
  let chatLoading = $state(false);
  let chatError = $state<string | null>(null);

  let messageInput = '';
  let travelSavedRequest: TravelPlanRequest = {
    location: '',
    startDate: '',
    endDate: '',
    keywords: '',
    transportation: '',
    style: '',
    companion: ''
  };

  let existsMessage = $derived(messages.length > 0);
  let plan = $derived([...messages].reverse().find(msg => msg.role === 'plan'));

  // TravelPlan -> TravelPlanResult 변환 함수
  function convertPlanToResult(plan: TravelPlan): TravelPlanResult {
    // 일정 데이터를 변환
    const itinerary = plan.days.map((day, index) => {
      return {
        day: index + 1,
        date: day.date,
        activities: [
          `오전: ${day.morning}`,
          `점심: ${day.lunch}`,
          `오후: ${day.afternoon}`,
          `저녁: ${day.evening}`
        ]
      };
    });

    return {
      summary: plan.overview,
      itinerary: itinerary
    };
  }

  // TravelPlanResult -> TravelPlan 변환 함수 (필요시)
  function convertResultToPlan(result: TravelPlanResult): TravelPlan {
    // 데이터 형태에 맞게 변환 로직 구현
    const days = result.itinerary.map(item => {
      // 활동 내용에서 필요한 정보 추출
      const morning = item.activities.find(a => a.startsWith('오전:'))?.substring(4) || '';
      const lunch = item.activities.find(a => a.startsWith('점심:'))?.substring(4) || '';
      const afternoon = item.activities.find(a => a.startsWith('오후:'))?.substring(4) || '';
      const evening = item.activities.find(a => a.startsWith('저녁:'))?.substring(4) || '';
      
      return {
        date: item.date,
        morning,
        lunch,
        afternoon,
        evening
      };
    });

    return {
      title: `${travelSavedRequest.location} 여행`,
      overview: result.summary,
      assistantMessage: '',  // 필요한 assistantMessage 필드 추가
      days: days
    };
  }

  // 일정 생성 폼 제출 핸들러
  async function handleSubmit(travelRequest: TravelPlanRequest) {
    travelSavedRequest = travelRequest;
    loading = true;
    error = null;

    try {
      const result = await api.postMakePlan(travelRequest);     
      if (result && result.messages) {        
        result.messages.forEach(message => {
          messages.push(message);
        });
        
      }
    } catch (e) {
      if (e instanceof ApiError) {
        error = e.title;
      } else {
        error = '알 수 없는 오류가 발생했습니다.';
      }
    } finally {
      loading = false;
    }
  }

  // 채팅 메시지 전송 핸들러
  async function sendMessage() {
    if (!messageInput.trim() || chatLoading) return;

    chatLoading = true;
    chatError = null;

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      role: 'user',
      content: messageInput,
      timestamp: new Date()
    };

    messages = [...messages, userMessage];
    messageInput = ''; // 입력 필드 초기화

    // try {
    //   // 타입 변환
    //   const travelPlanResult = convertPlanToResult(plan);

    //   // API 요청 데이터 준비
    //   const chatRequest: ChatRequest = {
    //     messages: messages,
    //     travelPlan: travelPlanResult
    //   };
        
    //   // API 요청
    //   const response = await fetch('/api', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(chatRequest)
    //   });
      
    //   if (!response.ok) {
    //     const errorData = await response.json();
    //     throw new Error(errorData.error || `HTTP 오류! 상태 코드: ${response.status}`);
    //   }
      
    //   // 응답 처리
    //   const result: ChatResponse = await response.json();
      
    //   // 응답 메시지 추가
    //   messages = [...messages, result.message];
      
    //   // 업데이트된 계획이 있으면 반영
    //   if (result.updatedPlan) {
    //     const updatedPlan = convertResultToPlan(result.updatedPlan);
    //     plan = updatedPlan;
    //   }
    // } catch (e: any) {
    //     chatError = e.message;
    //     console.error('채팅 메시지 전송 중 오류 발생:', e);
    // } finally {
    //     chatLoading = false;
    // }
  }

</script>

<div class="container">
  <h1>AI 여행 플래너</h1>
  {#if !existsMessage}
    <Form onInputCompleted={handleSubmit} />
  {/if}

  {#if error}
      <p class="error-message">오류: {error}</p>
  {/if}

  {#if existsMessage}
    <div class="plan-results">
      {#if plan}
        <Plan message={plan} />
      {/if}

      <Chatting messages={messages} />

    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>