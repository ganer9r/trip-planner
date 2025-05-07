<script lang="ts">
  import type { ChattingMessage } from '$lib/types';
	import dayjs from 'dayjs';

  type Props = {
    messages: ChattingMessage[];
    loading: boolean;
    onSendMessage: (message: string) => void;
  };

  let { messages, loading, onSendMessage }: Props = $props();

  let chatLoading = $state(false);
  let chatError = $state<string | null>(null);
  let messageInput = $state('');

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) { //문자조합 체크
      event.preventDefault();
      sendMessage();
     }
  }

  function sendMessage() {
    if (!messageInput.trim() || chatLoading) return;
    onSendMessage(messageInput);
    messageInput = '';
  }

  function formatMessageTime(timestamp: string | Date): string {
    const dayjsTimestamp = dayjs(timestamp);
    return dayjsTimestamp.locale('ko').format('A hh:mm');
  }
</script>

<div class="chat-section">
  <h2>여행 계획 수정하기</h2>
    <p>여행 계획에 대해 질문하거나 조정이 필요한 사항을 채팅으로 알려주세요.</p>
    
    <div class="chat-messages">
      {#each messages as message}
        {#if message.role === 'plan'}
          <div class="chat-message chat-plan">
            <div class="message-content">일정이 생성되었습니다.</div>
          </div>
        {:else}
          <div class="chat-message {message.role}">
            <div class="message-content">{message.content}</div>
            <div class="message-time">{formatMessageTime(message.timestamp)}</div>
          </div>
        {/if}
      {/each}
      
      {#if loading}
        <div class="chat-message assistant loading">
          <div class="loading-indicator">생각 중...</div>
        </div>
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
    
    {#if chatError}
      <p class="error-message">오류: {chatError}</p>
    {/if}
</div>


<style>
  .chat-section {
    margin-top: 30px;
    border-top: 1px solid #eee;
    padding-top: 20px;

    .chat-messages {
      height: 300px;
      overflow-y: auto;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background-color: #f5f5f5;
      margin-bottom: 15px;
    }
  }

  .chat-message {
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 10px;
    max-width: 80%;
    position: relative;

    .message-content {
      margin-bottom: 5px;
      word-wrap: break-word;
    }
    
    .message-time {
      font-size: 0.75rem;
      text-align: right;
      color: rgba(255, 255, 255, 0.7);
    }
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

    .message-time {
      color: #999;
    }
  }
  
  .chat-input-container {
    display: flex;
    gap: 10px;

    textarea {
      flex: 1;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      resize: none;
      height: 60px;
      font-family: inherit;
      font-size: 0.9rem;
    }

    button {
      width: 80px;
      min-height: 100%;
      font-size: 0.9rem;
    }
  }
  
  .loading-indicator {
    animation: pulse 1s infinite ease-in-out;
  }

  @keyframes pulse {
    0% { opacity: 0.4; }
    50% { opacity: 1; }
    100% { opacity: 0.4; }
  }
</style>