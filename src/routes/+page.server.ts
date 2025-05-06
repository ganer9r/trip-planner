import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	//TODO: uuid를 사용 하거나, user가 있다면 uid 등을 이용하는게 더 좋음.
	//TODO: 현재는 랜덤 숫자로 페이지 로드 할때마다 plan_id가 생성됨.

	const plan_id = Math.floor(Math.random() * 100000000);
	return {plan_id};
};