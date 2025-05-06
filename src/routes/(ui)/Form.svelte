<script lang="ts">
	import type { TravelPlanRequest } from "$src/lib/domain/plan/type";

  type Props = {
    onInputCompleted: (travelRequest: TravelPlanRequest) => void
  };

  let {onInputCompleted}: Props = $props();

  // UI 상태 및 결과
  let loading = $state(false);
  let error = $state<string | null>(null);

  let travelPlan: TravelPlanRequest = {
    location: '일본, 사가',
    startDate: '2025-05-26T09:40:00',
    endDate: '2025-05-28T12:30:00',
    //
    keywords: '온천 힐링, 식도락',
    transportation: '대중교통',
    style: '힐링',
    companion: '친구'
  };

  function validateTravelRequest(travelRequest: TravelPlanRequest) {
    if (new Date(travelRequest.startDate) > new Date(travelRequest.endDate)) {
      error = '시작일은 종료일보다 빠르거나 같아야 합니다.';
      loading = false;
      return;
    }

    return true;
  }

  // 폼 제출 핸들러
  async function handleSubmit() {
    error = null;
    if (!validateTravelRequest(travelPlan)) {
      return;
    }

    try {
      onInputCompleted(travelPlan);
    } catch (e: any) {
      error = e.message;
      console.error('여행 계획 요청 중 오류 발생:', e);
    }
  }

</script>

<form on:submit|preventDefault={handleSubmit}>
  <div class="form-group">
      <label for="location">목적지 (예: 이탈리아, 동남아시아):</label>
      <input type="text" id="location" bind:value={travelPlan.location} required />
  </div>

  <div class="form-group">
      <label for="startDate">시작일:</label>
      <input type="text" id="startDate" bind:value={travelPlan.startDate} required />
  </div>

  <div class="form-group">
      <label for="endDate">종료일:</label>
      <input type="text" id="endDate" bind:value={travelPlan.endDate} required />
  </div>

  <div class="form-group">
      <label for="keywords">관심사 (예: 역사, 음식, 하이킹):</label>
      <input type="text" id="keywords" bind:value={travelPlan.keywords} required />
  </div>

  <div class="form-group">
      <label for="transportation">이동수단 (예: 대중교통, 자동차):</label>
      <input type="text" id="transportation" bind:value={travelPlan.transportation} required />
  </div>

  <div class="form-group">
      <label for="style">여행 스타일 (예: 힐링, 모험, 탐험):</label>
      <input type="text" id="style" bind:value={travelPlan.style} required />
  </div>

  <div class="form-group">
      <label for="companion">동행자 (예: 친구, 가족):</label>
      <input type="text" id="companion" bind:value={travelPlan.companion} required />
  </div>
  

  <button type="submit" disabled={loading}>
      {#if loading}
          계획 생성 중...
      {:else}
          여행 계획 받기
      {/if}
  </button>
</form>


<style>
  .form-group {
    margin-bottom: 15px;
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #555;
    }
  
    input[type="text"],
    input[type="date"],
    input[type="number"] {
      width: calc(100% - 22px);
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 1rem;
    }
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
</style>