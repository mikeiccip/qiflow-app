import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

export const AI_MODELS = {
  fast: 'claude-haiku-4-5-20251001',
  quality: 'claude-sonnet-4-6',
} as const

const client = new Anthropic()

interface CallClaudeOptions<T> {
  model: string
  systemPrompt: string
  userMessage: string
  tool: {
    name: string
    description: string
    inputSchema: Record<string, unknown>
  }
  outputSchema: z.ZodType<T>
  fallback: T
  maxTokens?: number
  taskLabel?: string
}

export async function callClaude<T>({
  model,
  systemPrompt,
  userMessage,
  tool,
  outputSchema,
  fallback,
  maxTokens = 1024,
}: CallClaudeOptions<T>): Promise<{ data: T }> {
  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      tools: [
        {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema as Anthropic.Tool['input_schema'],
        },
      ],
      tool_choice: { type: 'tool', name: tool.name },
      messages: [{ role: 'user', content: userMessage }],
    })

    const toolUse = response.content.find((c) => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') return { data: fallback }

    const parsed = outputSchema.safeParse(toolUse.input)
    return { data: parsed.success ? parsed.data : fallback }
  } catch {
    return { data: fallback }
  }
}
