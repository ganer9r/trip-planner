import { ChatOpenAI } from "@langchain/openai";
import { OPENAI_API_KEY } from '$env/static/private';
import type { PromptConfig } from "./type";

//TODO: 추후 팩토리 등으로 변경
export function getModel(promptConfig: PromptConfig) {
  return new ChatOpenAI({
    modelName: promptConfig.modelName || 'gpt-3.5-turbo',
    temperature: promptConfig.temperature || 0.3,
    apiKey: OPENAI_API_KEY,
    // modelName: promptConfig.modelName || 'gpt-4o', // 더 나은 결과를 위해 gpt-4o 시도 가능
  });
}