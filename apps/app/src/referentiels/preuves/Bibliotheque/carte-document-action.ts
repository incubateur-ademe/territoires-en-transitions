import { match } from 'ts-pattern';
import { DocumentRattache } from './types';

export type CarteDocumentAction = 'edit' | 'comment' | 'replace' | 'delete';

export const MUTATION_ACTIONS: readonly CarteDocumentAction[] = [
  'edit',
  'comment',
  'delete',
];

export const isActionCarriedBy = (
  action: CarteDocumentAction,
  { preuveType, type }: Pick<DocumentRattache, 'preuveType' | 'type'>
): boolean =>
  match(action)
    .with('replace', () => preuveType === 'audit')
    .with('delete', () => preuveType !== 'audit')
    .with('edit', () => type !== 'fichierManquant')
    .with('comment', () => true)
    .exhaustive();
