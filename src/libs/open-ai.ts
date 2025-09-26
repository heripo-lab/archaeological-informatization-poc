import OpenAI from 'openai';
import * as CompletionsAPI from 'openai/src/resources/completions';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // .env.local 에 저장돼 있어야 함
});

export const callOpenAI = async (
  prompt: {
    system: string;
    user: string;
    assistant?: string;
  },
  options?: {
    model?: string;
    max_completion_tokens?: number;
    temperature?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
  },
): Promise<{ content: string | null; usage?: CompletionsAPI.CompletionUsage }> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      ...options,
    });

    return {
      content: response.choices[0].message.content,
      usage: response.usage, // 소모된 토큰 정보
    };
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (error.status === 429) {
      console.warn('요청 제한 초과. 10초 후 재시도합니다...', error);
      await new Promise(resolve => setTimeout(resolve, 10000));
      return callOpenAI(prompt, options); // 재실행
    }
    console.error('OpenAI API 호출 중 오류 발생:', error);
    throw new Error('OpenAI API 호출 중 오류가 발생했습니다.');
  }
};
