<!-- src/routes/+page.svelte -->
<script lang="ts">
  import Form from './(ui)/Form.svelte';
  import { ApiError, PlanApi } from '$src/lib/domain/plan/api';
  import type { TravelPlan, TravelPlanRequest, TravelPlanUpdateRequest } from '$src/lib/domain/plan/type';
  import type { ChattingMessage, TravelPlanResult } from '$lib/types';
	import Plan from './(ui)/Plan.svelte';
	import Chatting from './(ui)/Chatting.svelte';

  let { data } = $props();
  const api = new PlanApi(fetch);

  // UI 상태 및 결과
  let { planId } = data;
  let loading = $state(false);
  let error = $state<string | null>(null);
  let messages = $state<ChattingMessage[]>([]);

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


  function addUserMessage(message: string) {
    const userMessage: ChattingMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    messages.push(userMessage);
  }

  // 일정 생성 폼 제출 핸들러
  async function handleSubmit(travelRequest: TravelPlanRequest) {
    travelSavedRequest = travelRequest;
    travelSavedRequest.planId = planId;
    
    console.log('travelSavedRequest', travelRequest);
    loading = true;
    error = null;

    try {
      const result = await api.makePlan(travelRequest);
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
  async function sendMessage(messageInput: string) {
    loading = true;
    error = null;

    addUserMessage(messageInput);

    try {
      const travelPlanResult = JSON.stringify(plan?.content as TravelPlan);

      // // API 요청 데이터 준비
      const chatRequest: TravelPlanUpdateRequest = {
        planId: planId,
        feedback: messageInput,
        plan: travelPlanResult,
        travelRequest: travelSavedRequest
      };

      const result = await api.updatePlan(chatRequest);
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

</script>

<div class="container">
  <h1>AI 여행 플래너</h1>
  {#if !existsMessage}
    <Form 
      {loading}
      onInputCompleted={handleSubmit} 
    />
  {/if}

  {#if error}
      <p class="error-message">오류: {error}</p>
  {/if}

  {#if existsMessage}
    <div class="plan-results">
      {#if plan}
        <Plan message={plan} />
      {/if}

      <Chatting 
        messages={messages} 
        onSendMessage={sendMessage}
        {loading}
      />

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