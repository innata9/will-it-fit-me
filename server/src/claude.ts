import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { z } from 'zod';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

/** Stronger model for judgements (verdicts, color type, looks). */
export const MAIN_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5-5';
/** Lighter, cheaper model for pulling facts out of product pages. */
export const EXTRACT_MODEL = process.env.ANTHROPIC_EXTRACT_MODEL ?? 'claude-haiku-5-5';

export type ContentBlock = Anthropic.Messages.ContentBlockParam;

export async function askStructured<S extends z.ZodType>(opts: {
  model: string;
  system: string;
  content: ContentBlock[];
  schema: S;
  maxTokens?: number;
}): Promise<z.infer<S>> {
  const message = await client.messages.parse({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: 'user', content: opts.content }],
    output_config: { format: zodOutputFormat(opts.schema) },
  });
  if (message.parsed_output == null) {
    throw new Error(`Model returned no structured output (stop_reason: ${message.stop_reason})`);
  }
  return message.parsed_output as z.infer<S>;
}

export function imageBlock(base64: string, mediaType: string): ContentBlock {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
  const mt = (allowed as readonly string[]).includes(mediaType) ? mediaType : 'image/jpeg';
  return {
    type: 'image',
    source: { type: 'base64', media_type: mt as (typeof allowed)[number], data: base64 },
  };
}

export function textBlock(text: string): ContentBlock {
  return { type: 'text', text };
}
