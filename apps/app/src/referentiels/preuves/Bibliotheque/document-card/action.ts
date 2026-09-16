import { match } from 'ts-pattern';
import { PreuveType } from '../types';

export type DocumentCardAction = 'edit' | 'comment' | 'replace' | 'delete';

export const MUTATION_ACTIONS: readonly DocumentCardAction[] = [
  'edit',
  'comment',
  'delete',
];

export const isActionCarriedBy = (
  action: DocumentCardAction,
  preuveType: PreuveType
): boolean =>
  match(action)
    .with('replace', () => preuveType === 'audit')
    .with('delete', () => preuveType !== 'audit')
    .with('edit', 'comment', () => true)
    .exhaustive();
