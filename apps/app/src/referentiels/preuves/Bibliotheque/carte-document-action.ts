import { match } from 'ts-pattern';
import { PreuveType } from './types';

export type CarteDocumentAction = 'edit' | 'comment' | 'replace' | 'delete';

export const MUTATION_ACTIONS: readonly CarteDocumentAction[] = [
  'edit',
  'comment',
  'delete',
];

export const isActionCarriedBy = (
  action: CarteDocumentAction,
  preuveType: PreuveType
): boolean =>
  match(action)
    .with('replace', () => preuveType === 'audit')
    .with('delete', () => preuveType !== 'audit')
    .with('edit', 'comment', () => true)
    .exhaustive();
