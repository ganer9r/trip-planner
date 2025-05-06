import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	//TODO: uuid를 사용하는것이 더 좋음.
	//TODO: 현재는 랜덤 숫자로 페이지 로드 할때마다 plan_id가 생성됨.

	const planId = 'session-' + Math.floor(Math.random() * 100000000);
	return {planId};
};