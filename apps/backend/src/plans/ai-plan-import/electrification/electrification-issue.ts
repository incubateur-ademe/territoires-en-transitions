import { ImportReport } from '../models/import-report';

/** Signalement d'import partagé par tous les profils (lecture, configuration, traitement). */
export type ElectrificationIssue = ImportReport['issues'][number];

type ElectrificationIssueMessages = Record<
  string,
  Pick<ElectrificationIssue, 'kind' | 'message'>
>;

/**
 * Construit une fabrique de signalements à partir d'une table de messages.
 * Centralise la forme `{ code, kind, message, location? }` autrefois dupliquée
 * dans chaque module d'erreurs Électrification.
 */
export function createIssueFactory<T extends ElectrificationIssueMessages>(
  messages: T
) {
  return (code: keyof T & string, location?: string): ElectrificationIssue => ({
    code,
    ...messages[code],
    ...(location ? { location } : {}),
  });
}
