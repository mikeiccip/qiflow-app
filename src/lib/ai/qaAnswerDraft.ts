/**
 * AI draft answer generation for admin Q&A queue.
 * Uses Haiku (fast, cheap) — admin will always review and edit before publishing.
 * Draft is stored server-side in ai_draft column; never auto-published — practitioner must review first.
 */

import { callClaude, AI_MODELS } from './claude'
import { qaAnswerDraftSchema, QA_DRAFT_FALLBACK } from './schemas'
import { sanitiseUserInput } from './moderation'

export async function generateQADraft(
  question: string,
  category: string
): Promise<{ draft_answer: string; confidence: 'high' | 'medium' | 'low'; notes_for_practitioner?: string }> {
  const sanitised = sanitiseUserInput(question)

  const result = await callClaude({
    model: AI_MODELS.fast,
    taskLabel: 'qa_draft',
    systemPrompt: `You are assisting a Traditional Chinese Medicine (TCM) practitioner in the UK.
Draft a suggested answer to a member's wellness question. The practitioner WILL review and edit this before it is published — this is a draft only.

Rules:
- Use 'may support', 'traditionally used for', 'some people find' — never 'treats', 'cures', or medical absolutes
- Recommend consulting a GP for anything medical or urgent
- Max 600 characters — practitioners will expand if needed
- Category: ${category}
- British English spelling`,
    userMessage: `Member question: <user_content>${sanitised}</user_content>

Draft a helpful, warm, TCM-informed answer that the practitioner can review and personalise.`,
    tool: {
      name: 'draft_qa_answer',
      description: 'Draft a suggested answer for the practitioner to review.',
      inputSchema: {
        type: 'object',
        properties: {
          draft_answer: {
            type: 'string',
            description: 'Suggested answer, max 600 chars. Phrased as wellbeing support, not medical advice.',
          },
          confidence: {
            type: 'string',
            enum: ['high', 'medium', 'low'],
            description: 'How confident the model is that this draft is on-point.',
          },
          notes_for_practitioner: {
            type: 'string',
            description: 'Optional private notes for the practitioner (not shown to member).',
          },
        },
        required: ['draft_answer', 'confidence'],
      },
    },
    outputSchema: qaAnswerDraftSchema,
    fallback: QA_DRAFT_FALLBACK,
    maxTokens: 512,
  })

  return result.data
}
