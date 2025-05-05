import { z } from 'zod';

export const TravelPlanSchema = z.object({
  title: z.string().describe("여행 계획의 제목"),
  overview: z.string().describe("여행 계획에 대한 간략한 소개"),
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
});

// 스키마의 TypeScript 타입 추론
export type TravelPlan = z.infer<typeof TravelPlanSchema>;