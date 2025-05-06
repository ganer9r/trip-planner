import { z } from 'zod';

export const TravelPlanSchema = z.object({
  title: z.string().describe("여행 계획의 제목"),
  overview: z.string().describe("여행 계획에 대한 간략한 소개"),
  assistantMessage: z.string().describe("일정 추천 후 사용자 피드백 유도 메시지"),
  days: z.array(
      z.object({
          date: z.string().describe("여행 날짜 (예: YYYY년 MM월 DD일)"),
          morning: z.string().describe("오전 일정 및 설명"),
          lunch: z.string().describe("점심 추천 식당 또는 음식"),
          afternoon: z.string().describe("오후 일정 및 설명"),
          evening: z.string().describe("저녁 활동 또는 추천 식당"),
      })
  ).describe("각 날짜별 상세 일정 목록"),
  references: z.array(
      z.object({
           title: z.string().describe("참조한 정보 출처의 제목 (예: 블로그 제목)"),
           url: z.string().url().describe("참조한 정보 출처의 URL"),
           description: z.string().optional().describe("정보 출처에 대한 간략한 설명 (선택 사항)")
      })
  ).optional().describe("참조한 외부 정보 출처 목록 (URL 포함). 정보가 부족하면 빈 배열"),
  planId: z.string().optional().describe("여행 계획의 고유 ID"),
});
export type TravelPlan = z.infer<typeof TravelPlanSchema>;


//
export const TravelPlanRequestSchema = z.object({
    location: z.string().min(2).describe("목적지"),
    startDate: z.string().min(10).describe("도착일시"),
    endDate: z.string().min(10).describe("종료일시"),
    keywords: z.string().min(2).optional().describe("키워드"),
    transportation: z.string().min(2).optional().describe("이동수단"),
    style: z.string().min(2).optional().describe("여행 스타일"),
    companion: z.string().optional().describe("동행자"),
});
export type TravelPlanRequest = z.infer<typeof TravelPlanRequestSchema>;

// 여행 계획 수정 요청을 위한 스키마
export const TravelPlanUpdateRequestSchema = z.object({
    planId: z.string().min(1).describe("수정할 여행 계획의 ID"),
    message: z.string().min(1).describe("수정 요청 메시지"),
    plan: TravelPlanSchema.optional().describe("기존 여행 계획 데이터 (선택 사항)"),
});
export type TravelPlanUpdateRequest = z.infer<typeof TravelPlanUpdateRequestSchema>;