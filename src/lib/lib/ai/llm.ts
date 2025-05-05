import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
}

const openaiClient = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const OPENAI_MODEL = "gpt-3.5-turbo";
export { openaiClient, OPENAI_MODEL };