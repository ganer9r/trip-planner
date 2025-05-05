<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { writable } from 'svelte/store';
  import type { TravelPlanRequest, TravelPlanResult, Message, ChatRequest, ChatResponse } from '$lib/lib/types';

  // 폼 입력 상태
  let destination = '';
  let startDate = '';
  let endDate = '';
  let interests = '';
  let travelers = 1;

  // UI 상태 및 결과
  const loading = writable(false);
  const error = writable<string | null>(null);
  const plan = writable<TravelPlanResult | null>(null);
  
  // 채팅 관련 상태
  const messages = writable<Message[]>([]);
  const chatLoading = writable(false);
  const chatError = writable<string | null>(null);
  let messageInput = '';

  // 폼 제출 핸들러
  async function handleSubmit() {
      $loading = true;
      $error = null; // 이전 에러 초기화
      $plan = null; // 이전 결과 초기화
      $messages = []; // 이전 메시지 초기화

      const travelRequest: TravelPlanRequest = {
          destination,
          startDate,
          endDate,
          interests,
          travelers: Number(travelers) // 숫자로 변환
      };

      // 날짜 유효성 검사 (선택 사항)
      if (new Date(startDate) > new Date(endDate)) {
           $error = '시작일은 종료일보다 빠르거나 같아야 합니다.';
           $loading = false;
           return;
       }


      try {
          const response = await fetch('/api', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(travelRequest)
          });

          if (!response.ok) {
               // 서버에서 보낸 JSON 에러 메시지를 파싱
               const errorData = await response.json();
              throw new Error(errorData.error || `HTTP 오류! 상태 코드: ${response.status}`);
          }

          const result: TravelPlanResult = await response.json();
          $plan = result;

      } catch (e: any) {
          $error = e.message;
          console.error('여행 계획 요청 중 오류 발생:', e);
      } finally {
          $loading = false;
      }
  }

  // 채팅 메시지 전송 핸들러
  async function sendMessage() {
    if (!messageInput.trim() || $chatLoading || !$plan) return;
    
    $chatLoading = true;
    $chatError = null;
    
    // 사용자 메시지 추가
    const userMessage: Message = {
      role: 'user',
      content: messageInput,
      timestamp: new Date()
    };
    
    $messages = [...$messages, userMessage];
    messageInput = ''; // 입력 필드 초기화
    
    try {
      // API 요청 데이터 준비
      const chatRequest: ChatRequest = {
        messages: $messages,
        travelPlan: $plan!
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
      $messages = [...$messages, result.message];
      
      // 업데이트된 계획이 있으면 반영
      if (result.updatedPlan) {
        $plan = result.updatedPlan;
      }
    } catch (e: any) {
      $chatError = e.message;
      console.error('채팅 메시지 전송 중 오류 발생:', e);
    } finally {
      $chatLoading = false;
    }
  }

   // 날짜 포맷팅 헬퍼
   function formatDate(dateString: string): string {
       if (!dateString) return '';
       try {
           // YYYY-MM-DD 형식을 한국어 날짜 형식으로 포맷팅
           const date = new Date(dateString);
           if (isNaN(date.getTime())) {
               return dateString; // 유효하지 않으면 원본 반환
           }
           const options: Intl.DateTimeFormatOptions = {
               weekday: 'long', // 요일 (예: 월요일)
               year: 'numeric', // 연도 (예: 2024년)
               month: 'long',   // 월 (예: 8월)
               day: 'numeric'   // 일 (예: 1일)
           };
           return date.toLocaleDateString('ko-KR', options);
       } catch (e) {
            console.error("날짜 포맷팅 오류:", e);
           return dateString; // 오류 시 원본 반환
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

  <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
          <label for="destination">목적지 (예: 이탈리아, 동남아시아):</label>
          <input type="text" id="destination" bind:value={destination} required />
      </div>

      <div class="form-group">
          <label for="startDate">시작일:</label>
          <input type="date" id="startDate" bind:value={startDate} required />
      </div>

      <div class="form-group">
          <label for="endDate">종료일:</label>
          <input type="date" id="endDate" bind:value={endDate} required />
      </div>

      <div class="form-group">
          <label for="interests">관심사 (예: 역사, 음식, 하이킹):</label>
          <input type="text" id="interests" bind:value={interests} required />
      </div>

      <div class="form-group">
          <label for="travelers">여행자 수:</label>
          <input type="number" id="travelers" bind:value={travelers} min="1" required />
      </div>

      <button type="submit" disabled={$loading}>
          {#if $loading}
              계획 생성 중...
          {:else}
              여행 계획 받기
          {/if}
      </button>
  </form>

  {#if $error}
      <p class="error-message">오류: {$error}</p>
  {/if}

  {#if $plan}
      <div class="plan-results">
          <h2>여행 계획 결과</h2>
          <p>{$plan.summary}</p>

          {#each $plan.itinerary as dayPlan}
              <div class="day-plan">
                  <h3>Day {dayPlan.day} - {formatDate(dayPlan.date)}</h3>
                  <ul>
                      {#each dayPlan.activities as activity}
                          <li>{activity}</li>
                      {/each}
                  </ul>
              </div>
          {/each}
          
          <div class="chat-section">
              <h2>여행 계획 수정하기</h2>
              <p>여행 계획에 대해 질문하거나 조정이 필요한 사항을 채팅으로 알려주세요.</p>
              
              {#if $chatError}
                  <p class="error-message">채팅 오류: {$chatError}</p>
              {/if}
              
              <div class="chat-messages">
                  {#if $messages.length === 0}
                      <div class="empty-chat-message">여행 계획에 대해 질문해보세요!</div>
                  {:else}
                      {#each $messages as message}
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
                      on:keydown={handleKeyDown}
                      placeholder="여행 계획 수정에 대해 메시지를 입력하세요..."
                      disabled={$chatLoading}
                  ></textarea>
                  <button 
                      on:click={sendMessage} 
                      disabled={!messageInput.trim() || $chatLoading}
                  >
                      {#if $chatLoading}
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
      text-align: center;
      color: #333;
  }

  .form-group {
      margin-bottom: 15px;
  }

  label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #555;
  }

  input[type="text"],
  input[type="date"],
  input[type="number"] {
      width: calc(100% - 22px); /* Adjust for padding and border */
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 1rem;
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

  .plan-results {
      margin-top: 30px;
      border-top: 1px solid #eee;
      padding-top: 20px;
  }

  .day-plan {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 6px;
  }

  .day-plan h3 {
      margin-top: 0;
      color: #007bff;
  }

  .day-plan ul {
      padding-left: 25px;
      margin: 0;
  }

  .day-plan li {
      margin-bottom: 8px;
      line-height: 1.5;
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