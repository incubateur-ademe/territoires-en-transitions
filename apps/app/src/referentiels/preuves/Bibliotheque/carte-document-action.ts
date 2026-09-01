import { match } from 'ts-pattern';
import { TPreuveType } from './types';

export type CarteDocumentAction =
  | 'edit'
  | 'comment'
  | 'replace'
  | 'reclassify'
  | 'delete';

export const MUTATION_ACTIONS: readonly CarteDocumentAction[] = [
  'edit',
  'comment',
  'delete',
];

export const isActionCarriedBy = (
  action: CarteDocumentAction,
  preuveType: TPreuveType
): boolean =>
  match(action)
    .with('replace', () => preuveType === 'audit')
    .with('reclassify', () => preuveType === 'labellisation')
    .with('delete', () => preuveType !== 'audit')
    .with('edit', 'comment', () => true)
    .exhaustive();
