import { CHAT_MODELS_BY_PROVIDER } from "@/lib/chat-models";

export const OPENAI_COMPAT_CHAT_MODEL_ID = "openai-compatible-aisdk" as const;

/** Hugging Face Inference router: user supplies full Hub model id (required) */
export const HF_CUSTOM_HUB_MODEL_ID = "hf-custom-hub-aisdk" as const;

const HF_AISDK_IDS = new Set(CHAT_MODELS_BY_PROVIDER["Hugging Face (AI SDK)"] as readonly string[]);

const LEGACY_HF_IDS = new Set(CHAT_MODELS_BY_PROVIDER["Hugging Face"] as readonly string[]);

export function isOpenAiCompatibleChatModel(model: string): boolean {
  return model === OPENAI_COMPAT_CHAT_MODEL_ID;
}

/** Hugging Face legacy inference client modes or HF AI SDK hub models — optional custom hub id override */
export function needsHuggingFaceCustomModelField(model: string): boolean {
  return HF_AISDK_IDS.has(model) || LEGACY_HF_IDS.has(model);
}

export function isHuggingFaceCustomHubModel(model: string): boolean {
  return model === HF_CUSTOM_HUB_MODEL_ID;
}
