export interface TravelPlanRequest {
  destination: string; // 예: "유럽" 또는 "동남아시아"
  startDate: string;   // 예: "2024-08-01" (input type="date" 형식)
  endDate: string;     // 예: "2024-08-10"
  interests: string;   // 예: "역사, 음식, 하이킹"
  travelers: number;   // 예: 2
}

export interface ItineraryItem {
  day: number;
  date: string; // 실제 날짜 (YYYY-MM-DD)
  activities: string[]; // 그 날의 활동 목록

  // 필요에 따라 추가 필드 (예: 식사, 교통)
}

export interface TravelPlanResult {
  summary: string;    // 여행 계획 요약 (선택된 도시 등)
  itinerary: ItineraryItem[];

  // 필요에 따라 추가 정보 (예: 준비물, 팁)
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  messages: Message[];
  travelPlan: TravelPlanResult;
}

export interface ChatResponse {
  message: Message;
  updatedPlan?: TravelPlanResult;
}
