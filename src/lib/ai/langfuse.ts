import { Langfuse } from "langfuse-node";
import { LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST } from '$env/static/private';
import CallbackHandler from "langfuse-langchain";

if (!LANGFUSE_PUBLIC_KEY || !LANGFUSE_SECRET_KEY) {
     throw new Error('LangFuse API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

const langfuseParams = {
  publicKey: LANGFUSE_PUBLIC_KEY,
  secretKey: LANGFUSE_SECRET_KEY,
  baseUrl: LANGFUSE_HOST,
  flushAt: 1
}

const langfuse = new Langfuse(langfuseParams);
const langfuseLangchainHandler = new CallbackHandler(langfuseParams);

export { langfuse, langfuseLangchainHandler };


