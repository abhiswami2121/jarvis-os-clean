import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const runtime = 'nodejs';

const deepseek = createOpenAICompatible({
  name: 'deepseek',
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY!,
});

const kimi = createOpenAICompatible({
  name: 'kimi',
  baseURL: process.env.KIMI_API_BASE || 'https://api.moonshot.ai/v1',
  apiKey: process.env.KIMI_API_KEY!,
});

function resolveModel(modelId: string) {
  if (modelId === 'kimi-k2.6') return kimi('kimi-k2.6');
  return deepseek('deepseek-chat');
}

// Accept both UIMessage[] (assistant-ui v6) and {role, content}[] (OpenAI-style)
function normalizeMessages(input: any): UIMessage[] {
  if (!Array.isArray(input)) return [];
  return input.map((m: any, idx: number) => {
    // Already UIMessage format
    if (m.parts && Array.isArray(m.parts)) return m as UIMessage;
    // OpenAI-style with string content
    if (typeof m.content === 'string') {
      return {
        id: m.id || `msg_${idx}_${Date.now()}`,
        role: m.role || 'user',
        parts: [{ type: 'text', text: m.content }],
      } as unknown as UIMessage;
    }
    // Array content (multipart from various clients)
    if (Array.isArray(m.content)) {
      const parts = m.content.map((c: any) => {
        if (typeof c === 'string') return { type: 'text', text: c };
        if (c.type === 'text') return c;
        return { type: 'text', text: JSON.stringify(c) };
      });
      return {
        id: m.id || `msg_${idx}_${Date.now()}`,
        role: m.role || 'user',
        parts,
      } as unknown as UIMessage;
    }
    // Fallback
    return {
      id: m.id || `msg_${idx}_${Date.now()}`,
      role: m.role || 'user',
      parts: [{ type: 'text', text: String(m.content || '') }],
    } as unknown as UIMessage;
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages: rawMessages, model_id } = body as { messages: any[]; model_id?: string };
    
    if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages array required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    
    const normalized = normalizeMessages(rawMessages);
    
    const result = streamText({
      model: resolveModel(model_id || 'deepseek-v4-pro'),
      system: `You are Jarvis — an elite AI agent for NewLeaf Financial. Be concise. Be helpful.`,
      messages: await convertToModelMessages(normalized),
    });

    req.signal.addEventListener('abort', () => {});

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('[/api/chat] Stream failure:', error?.message || error);
    return new Response(
      JSON.stringify({
        error: 'Stream initialization failed',
        detail: error?.message || String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
