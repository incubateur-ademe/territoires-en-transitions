import { createIssueFactory, ElectrificationIssue } from '../electrification-issue';

const messages = {
  INVALID_ELECTRIFICATION_PLAN_NAME: {
    kind: 'document-error',
    message: 'Le nom du plan est obligatoire.',
  },
  ELECTRIFICATION_IMPORT_NOT_ALLOWED: {
    kind: 'processing-error',
    message:
      "Les droits, l'éligibilité ou le type de plan ne permettent pas cet import.",
  },
  ELECTRIFICATION_REFERENCES_CHANGED: {
    kind: 'configuration-error',
    message:
      "Une définition d'indicateur a changé ou n'est plus disponible. Relancez la vérification de l'import.",
  },
  ELECTRIFICATION_PERSISTENCE_FAILED: {
    kind: 'processing-error',
    message:
      "Le plan n'a pas pu être enregistré. Aucune modification de cet import n'a été conservée.",
  },
  EXISTING_INDICATEUR_VALUE_PRESERVED: {
    kind: 'preserved-data',
    message:
      'Une valeur différente existe déjà pour cet indicateur et cette période ; elle a été conservée.',
  },
} as const satisfies Record<
  string,
  Pick<ElectrificationIssue, 'kind' | 'message'>
>;

export class ElectrificationPersistenceErrors {
  static issue = createIssueFactory(messages);
}
