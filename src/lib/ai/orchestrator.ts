import { researchCitiesTask, selectCityTask, generateItineraryTask } from './agents';
import type { TravelPlanRequest, TravelPlanResult } from '../types';

export async function planTravel(request: TravelPlanRequest): Promise<TravelPlanResult> {
    console.log('오케스트레이터: 여행 계획 생성 프로세스 시작', request);

    try {
        // 1. 도시 연구 에이전트 호출 (목업 사용 시 목업 데이터 반환)
        const potentialCities = await researchCitiesTask(request.destination, request.interests);
        console.log('오케스트레이터: 찾은 잠재적 도시:', potentialCities.map(c => c.name).join(', '));

        // 2. 도시 선택 에이전트 호출 (목업 사용 시 목업 데이터 반환)
        const selectedCity = await selectCityTask(potentialCities, request.interests, request.travelers);
        console.log('오케스트레이터: 선택된 도시:', selectedCity);

        // 3. 여행 계획 생성 에이전트 호출 (선택된 도시 기반, 목업 사용 시 목업 데이터 반환)
        const finalPlan = await generateItineraryTask(request, selectedCity);
        console.log('오케스트레이터: 최종 계획 생성 완료');

        console.log('오케스트레이터: 여행 계획 생성 프로세스 성공적으로 완료.');
        return finalPlan;
    } catch (error) {
        console.error('오케스트레이터 실행 중 오류 발생:', error);
        throw error; // 상위 호출자에게 오류 전파
    }
}