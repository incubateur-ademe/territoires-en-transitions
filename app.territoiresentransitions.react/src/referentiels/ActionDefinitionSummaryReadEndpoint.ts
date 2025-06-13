import { RouterOutput } from '@/api/utils/trpc/client';

/**
 * Action definition Summary
 * Used to display an action using only displayed information
 */
export type ActionDefinitionSummary =
  RouterOutput['referentiels']['actions']['listActionSummaries'][number];
