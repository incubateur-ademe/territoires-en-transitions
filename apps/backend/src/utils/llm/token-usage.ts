import { TokenUsage } from './llm.repository';

export const emptyTokenUsage = (): TokenUsage => ({
  promptTokens: 0,
  candidatesTokens: 0,
  thoughtsTokens: 0,
  totalTokens: 0,
});

export const sumTokenUsage = (usages: TokenUsage[]): TokenUsage =>
  usages.reduce(
    (total, usage) => ({
      promptTokens: total.promptTokens + usage.promptTokens,
      candidatesTokens: total.candidatesTokens + usage.candidatesTokens,
      thoughtsTokens: total.thoughtsTokens + usage.thoughtsTokens,
      totalTokens: total.totalTokens + usage.totalTokens,
    }),
    emptyTokenUsage()
  );
