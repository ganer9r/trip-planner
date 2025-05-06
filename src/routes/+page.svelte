<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';
  import type { TravelPlanResult, Message, ChatRequest, ChatResponse } from '$lib/types';
  import Form from './(ui)/Form.svelte';
  import { ApiError, PlanApi } from '$src/lib/domain/plan/api';
  import type { TravelPlan, TravelPlanRequest } from '$src/lib/domain/plan/type';
	import Plan from './(ui)/Plan.svelte';


  const api = new PlanApi(fetch);

  // UI 상태 및 결과
  let loading = $state(false);
  let error = $state<string | null>(null);
  let plan = $state<TravelPlan | null>(null);

  // 채팅 관련 상태
  let messages = $state<Message[]>([]);
  let chatLoading = $state(false);
  let chatError = $state<string | null>(null);

  let messageInput = '';

  let travelSavedRequest: TravelPlanRequest = {
    destination: '',
    startDate: '',
    endDate: '',
    interests: '',
    travelers: ''
  };

  // 일정 생성 폼 제출 핸들러
  async function handleSubmit(travelRequest: TravelPlanRequest) {
    travelSavedRequest = travelRequest;
    loading = true;

    try {
    const result = await api.postMakePlan(travelRequest);          
    plan = result.plan;

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
    if (!messageInput.trim() || chatLoading || !plan) return;

    chatLoading = true;
    chatError = null;

    // 사용자 메시지 추가
    const userMessage: Message = {
        role: 'user',
        content: messageInput,
        timestamp: new Date()
    };

    messages = [...messages, userMessage];
    messageInput = ''; // 입력 필드 초기화

    try {
      // API 요청 데이터 준비
      const chatRequest: ChatRequest = {
      messages: messages,
      travelPlan: plan!
      };
        
      // API 요청
      const response = await fetch('/api', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(chatRequest)
      });
      
      if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP 오류! 상태 코드: ${response.status}`);
      }
      
      // 응답 처리
      const result: ChatResponse = await response.json();
      
      // 응답 메시지 추가
      messages = [...messages, result.message];
      
      // 업데이트된 계획이 있으면 반영
      if (result.updatedPlan) {
        plan = result.updatedPlan;
      }
    } catch (e: any) {
        chatError = e.message;
        console.error('채팅 메시지 전송 중 오류 발생:', e);
    } finally {
        chatLoading = false;
    }
  }

  // 메시지 전송 키 입력 이벤트 처리
  function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
      }
  }

  // 메시지 시간 포맷팅
  function formatMessageTime(timestamp: Date): string {
      return timestamp.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
      });
  }
</script>

<div class="container">
  <h1>AI 여행 플래너</h1>

  {#if !plan}
    <Form onInputCompleted={handleSubmit} />
  {/if}

  {#if error}
      <p class="error-message">오류: {error}</p>
  {/if}

  {#if plan}
    <div class="plan-results">
        <Plan {plan} />

        <div class="chat-section">
            <h2>여행 계획 수정하기</h2>
              <p>여행 계획에 대해 질문하거나 조정이 필요한 사항을 채팅으로 알려주세요.</p>
              
              <div class="chat-messages">
                  {#if messages.length === 0}
                      <div class="empty-chat-message">여행 계획에 대해 질문해보세요!</div>
                  {:else}
                      {#each messages as message}
                          <div class="chat-message {message.role}">
                              <div class="message-content">{message.content}</div>
                              <div class="message-time">{formatMessageTime(message.timestamp)}</div>
                          </div>
                      {/each}
                  {/if}
              </div>
              
              <div class="chat-input-container">
                  <textarea 
                      bind:value={messageInput} 
                      onkeydown={handleKeyDown}
                      placeholder="여행 계획 수정에 대해 메시지를 입력하세요..."
                      disabled={chatLoading}
                  ></textarea>
                  <button 
                      onclick={sendMessage} 
                      disabled={!messageInput.trim() || chatLoading}
                  >
                      {#if chatLoading}
                          전송 중...
                      {:else}
                          전송
                      {/if}
                  </button>
              </div>
          </div>
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

  h1, h2 {
    color: #333;
    font-size: 1.5rem;
    font-weight: 700;
  }


  button {
      display: block;
      width: 100%;
      padding: 10px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1.1rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
  }

  button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
  }

  button:hover:not(:disabled) {
      background-color: #0056b3;
  }

  .error-message {
      color: red;
      text-align: center;
      margin-top: 15px;
  }
  
  /* 채팅 스타일 */
  .chat-section {
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 20px;
  }
  
  .chat-messages {
      height: 300px;
      overflow-y: auto;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background-color: #f5f5f5;
      margin-bottom: 15px;
  }
  
  .empty-chat-message {
      text-align: center;
      color: #999;
      margin-top: 120px;
  }
  
  .chat-message {
      margin-bottom: 10px;
      padding: 10px;
      border-radius: 10px;
      max-width: 80%;
      position: relative;
  }
  
  .chat-message.user {
      background-color: #007bff;
      color: white;
      margin-left: auto;
      border-bottom-right-radius: 0;
  }
  
  .chat-message.assistant {
      background-color: #e9e9e9;
      color: #333;
      margin-right: auto;
      border-bottom-left-radius: 0;
  }
  
  .message-content {
      margin-bottom: 5px;
      word-wrap: break-word;
  }
  
  .message-time {
      font-size: 0.75rem;
      text-align: right;
      color: rgba(255, 255, 255, 0.7);
  }
  
  .chat-message.assistant .message-time {
      color: #999;
  }
  
  .chat-input-container {
      display: flex;
      gap: 10px;
  }
  
  .chat-input-container textarea {
      flex: 1;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      resize: none;
      height: 60px;
      font-family: inherit;
      font-size: 0.9rem;
  }
  
  .chat-input-container button {
      align-self: flex-end;
      width: 80px;
      height: 40px;
      font-size: 0.9rem;
  }
</style>