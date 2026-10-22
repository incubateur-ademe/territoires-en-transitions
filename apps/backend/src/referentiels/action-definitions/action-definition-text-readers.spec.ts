import { TEMPLATED_ACTION_FIELDS } from '@tet/domain/referentiels';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Garde-fou : les textes des actions peuvent être balisés (`{{si dom}}…`), et
 * les colonnes ne contiennent que le rendu par défaut. Tout code qui lit ces
 * textes doit soit passer par `RenderActionTextsService` quand il connaît la
 * collectivité, soit servir volontairement le rendu par défaut. Un nouveau
 * lecteur fait échouer cette spec : l'adapter, puis le déclarer ici avec la
 * raison.
 */
const ALLOWED_READERS: Record<string, string> = {
  'referentiels/models/action-definition.table.ts': 'définition de la table',
  'referentiels/models/action-definition-columns.column.ts':
    'sélection de toutes les colonnes sauf templates',
  'referentiels/list-actions/list-action-definitions.service.ts':
    'rendu par défaut voulu (définitions publiques) ; option collectiviteId côté backend',
  'referentiels/list-actions/list-action-definitions.router.ts':
    'procédure publique : rendu par défaut voulu',
  'referentiels/list-actions/list-actions.service.ts':
    'listWithDetails : sous-requête dont le nom est adapté par HandleMesureAuditStatutService',
  'referentiels/get-referentiel/get-referentiel.repository.ts':
    'adapté par GetReferentielService (option collectiviteId)',
  'referentiels/action-definitions/action-definitions.repository.ts':
    'adapté par FicheExportPayloadService',
  'referentiels/historique/list-historique/list-historique.repository.ts':
    'adapté par ListHistoriqueService',
  'referentiels/export-score/load-score-comparison.service.ts':
    'adapté (listActionDefinitions avec collectiviteId)',
  'referentiels/score-indicatif/score-indicatif.repository.ts':
    'ne lit aucun texte (actionId, exprScore)',
  'plans/fiches/list-fiches/list-fiches.service.ts':
    'adapté (mesures liées, selon la collectivité de chaque fiche)',
  'collectivites/discussions/domain/discussion-query-service.ts': 'adapté',
  'collectivites/discussions/infrastructure/discussion.repository.impl.ts':
    'adapté',
  'indicateurs/definitions/list-platform-definitions/list-platform-definitions.repository.ts':
    'définitions de la plateforme, sans collectivité : rendu par défaut voulu',
};

const SRC_DIR = join(__dirname, '..', '..');

// comparés sans espaces : prettier coupe les appels sur plusieurs lignes
const READER_PATTERNS = [
  new RegExp(
    `actionDefinitionTable\\.(${TEMPLATED_ACTION_FIELDS.join('|')})\\b`
  ),
  /getTableColumns\(actionDefinitionTable\)/,
  /alias\(actionDefinitionTable\b/,
  /\bactionDefinitionColumns\b/,
  /:ListActionDefinitionsService\b/,
];

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter(
      (file) =>
        file.endsWith('.ts') &&
        !file.endsWith('.spec.ts') &&
        !file.endsWith('.e2e-spec.ts') &&
        !file.endsWith('.test-fixture.ts')
    )
    .map((file) => join(dir, file));
}

function listTextReaders(): string[] {
  return listSourceFiles(SRC_DIR)
    .filter((file) => {
      const content = readFileSync(file, 'utf8').replace(/\s+/g, '');
      return READER_PATTERNS.some((pattern) => pattern.test(content));
    })
    .map((file) => relative(SRC_DIR, file).split('\\').join('/'))
    .sort();
}

describe('lecteurs des textes des actions', () => {
  const readers = listTextReaders();

  test('tout lecteur des textes est adapté ou déclaré', () => {
    const undeclared = readers.filter((file) => !(file in ALLOWED_READERS));
    expect(
      undeclared,
      'Lecteur des textes des actions non déclaré : passer par RenderActionTextsService si la collectivité est connue, puis le déclarer dans ALLOWED_READERS'
    ).toEqual([]);
  });

  test('la liste blanche ne garde pas d’entrée périmée', () => {
    const stale = Object.keys(ALLOWED_READERS).filter(
      (file) => !readers.includes(file)
    );
    expect(stale).toEqual([]);
  });
});
