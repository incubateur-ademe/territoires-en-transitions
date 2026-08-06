import { describe, expect, it } from 'vitest';
import type {
  DemarcheDocumentDefinition,
  DemarcheDocumentDepose,
  DemarcheDocumentsSnapshot,
} from './demarche-document.schema';
import {
  computeDemarcheDocumentsCoverage,
  isDemarcheDossierDocumentsComplet,
} from './demarche-documents.rules';

const GLOBAL_ID = 'document_global';

const definition = (
  overrides: Partial<DemarcheDocumentDefinition> & { id: string }
): DemarcheDocumentDefinition => ({
  nom: overrides.id,
  description: '',
  requis: false,
  ordre: 0,
  portee: 'section',
  couverturePlateforme: null,
  substituts: [],
  ...overrides,
});

const depose = (documentId: string): DemarcheDocumentDepose => ({
  id: 1,
  documentId,
  commentaire: '',
  modifiedAt: '2026-08-05T00:00:00Z',
  modifiedBy: null,
  fichier: {
    id: 10,
    filename: `${documentId}.pdf`,
    hash: 'hash',
    bucketId: 'bucket',
    filesize: 1024,
  },
});

/** Modèle de démarche minimal : un global qui substitue deux sections requises. */
const snapshot = (
  overrides: Partial<DemarcheDocumentsSnapshot> = {}
): DemarcheDocumentsSnapshot => ({
  definitions: [
    definition({ id: GLOBAL_ID, portee: 'global', ordre: 0 }),
    definition({ id: 'diagnostic', requis: true, ordre: 1, substituts: [GLOBAL_ID] }),
    definition({
      id: 'dispositif_suivi_evaluation',
      requis: true,
      ordre: 2,
      couverturePlateforme: 'plan_actions',
      substituts: [GLOBAL_ID],
    }),
    definition({ id: 'ees', requis: false, ordre: 3, substituts: [GLOBAL_ID] }),
  ],
  documents: [],
  couvertures: [],
  planActionRattache: false,
  ...overrides,
});

describe('computeDemarcheDocumentsCoverage', () => {
  it('ne couvre rien sur un dossier vide', () => {
    const coverage = computeDemarcheDocumentsCoverage(snapshot());

    expect(coverage.every(({ couvert }) => couvert === false)).toBe(true);
    expect(coverage.every(({ origine }) => origine === null)).toBe(true);
  });

  it('couvre toutes les sections substituables dès que le document global est déposé', () => {
    const coverage = computeDemarcheDocumentsCoverage(
      snapshot({ documents: [depose(GLOBAL_ID)] })
    );

    expect(coverage).toEqual([
      { documentId: GLOBAL_ID, couvert: true, origine: 'fichier', substitutId: null },
      {
        documentId: 'diagnostic',
        couvert: true,
        origine: 'substitut',
        substitutId: GLOBAL_ID,
      },
      {
        documentId: 'dispositif_suivi_evaluation',
        couvert: true,
        origine: 'substitut',
        substitutId: GLOBAL_ID,
      },
      { documentId: 'ees', couvert: true, origine: 'substitut', substitutId: GLOBAL_ID },
    ]);
  });

  it('fait primer un dépôt spécifique sur la substitution', () => {
    const coverage = computeDemarcheDocumentsCoverage(
      snapshot({ documents: [depose(GLOBAL_ID), depose('diagnostic')] })
    );

    expect(coverage.find((c) => c.documentId === 'diagnostic')).toEqual({
      documentId: 'diagnostic',
      couvert: true,
      origine: 'fichier',
      substitutId: null,
    });
  });

  it('couvre une section déclarée comprise dans le plan d’actions rattaché', () => {
    const coverage = computeDemarcheDocumentsCoverage(
      snapshot({
        couvertures: [
          { documentId: 'dispositif_suivi_evaluation', source: 'plan_actions' },
        ],
        planActionRattache: true,
      })
    );

    expect(
      coverage.find((c) => c.documentId === 'dispositif_suivi_evaluation')
    ).toEqual({
      documentId: 'dispositif_suivi_evaluation',
      couvert: true,
      origine: 'plan_actions',
      substitutId: null,
    });
  });

  it('ignore une couverture par le plan d’actions si aucun plan n’est rattaché', () => {
    const coverage = computeDemarcheDocumentsCoverage(
      snapshot({
        couvertures: [
          { documentId: 'dispositif_suivi_evaluation', source: 'plan_actions' },
        ],
        planActionRattache: false,
      })
    );

    expect(
      coverage.find((c) => c.documentId === 'dispositif_suivi_evaluation')?.couvert
    ).toBe(false);
  });
});

describe('isDemarcheDossierDocumentsComplet', () => {
  it('est complet avec le seul document global', () => {
    expect(
      isDemarcheDossierDocumentsComplet(snapshot({ documents: [depose(GLOBAL_ID)] }))
    ).toBe(true);
  });

  it('est complet quand chaque section requise est couverte à sa façon', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          documents: [depose('diagnostic')],
          couvertures: [
            { documentId: 'dispositif_suivi_evaluation', source: 'plan_actions' },
          ],
          planActionRattache: true,
        })
      )
    ).toBe(true);
  });

  it('est incomplet s’il manque une section requise', () => {
    expect(
      isDemarcheDossierDocumentsComplet(snapshot({ documents: [depose('diagnostic')] }))
    ).toBe(false);
  });

  it('ignore les sections optionnelles', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          definitions: [
            definition({ id: 'diagnostic', requis: true, ordre: 1 }),
            definition({ id: 'ees', requis: false, ordre: 2 }),
          ],
          documents: [depose('diagnostic')],
        })
      )
    ).toBe(true);
  });

  it('est incomplet si le modèle ne définit aucune section requise', () => {
    expect(isDemarcheDossierDocumentsComplet(snapshot({ definitions: [] }))).toBe(false);
  });

  it('ne considère pas le document global comme une pièce requise', () => {
    expect(
      isDemarcheDossierDocumentsComplet(
        snapshot({
          definitions: [
            definition({ id: GLOBAL_ID, portee: 'global', requis: true, ordre: 0 }),
          ],
        })
      )
    ).toBe(false);
  });
});
