const BLOCKED_PATTERNS = [
  /\b(kill|harm|suicide|self.harm)\b/i,
  /<script/i,
]

export function sanitiseUserInput(input: string): string {
  return input.trim().slice(0, 1000)
}

export async function moderateText(text: string): Promise<{ safe: boolean; reason?: string }> {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'Content policy violation' }
    }
  }
  return { safe: true }
}
